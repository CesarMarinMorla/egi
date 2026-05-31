import sql from "mssql";
import type { Machine, MachineInput, AssigneeType } from "../types/index.js";
import config from "../config.js";

export interface ISqlClient {
	listMachines(): Promise<Machine[]>;
	getMachine(id: number): Promise<Machine | null>;
	createMachine(input: MachineInput): Promise<Machine>;
	updateMachine(id: number, input: Partial<MachineInput>): Promise<Machine | null>;
	deleteMachine(id: number): Promise<boolean>;
}

function rowToMachine(row: Record<string, unknown>): Machine {
	return {
		id: row.id as number,
		hostname: row.hostname as string,
		lab: row.lab as string,
		benchNumber: row.bench_number as number,
		maintenanceDate: row.maintenance_date ? (row.maintenance_date as Date).toISOString().slice(0, 10) : "",
		status: row.status as Machine["status"],
		assignee: (row.assignee as string) ?? undefined,
		assigneeType: (row.assignee_type as AssigneeType | undefined) ?? undefined,
	};
}

export async function createSqlClient(): Promise<ISqlClient> {
	const pool = await sql.connect({
		server: config.sql.server,
		port: config.sql.port,
		user: config.sql.user,
		password: config.sql.password,
		database: config.sql.database,
		options: {
			encrypt: config.sql.encrypt,
			trustServerCertificate: config.sql.trustServerCertificate,
		},
	});

	const client: ISqlClient = {
		async listMachines() {
			const result = await pool.request().query("SELECT * FROM machines");
			return result.recordset.map(rowToMachine);
		},

		async getMachine(id) {
			const result = await pool.request().input("id", sql.Int, id).query("SELECT * FROM machines WHERE id = @id");
			return result.recordset[0] ? rowToMachine(result.recordset[0]) : null;
		},

		async createMachine(input) {
			const result = await pool
				.request()
				.input("hostname", sql.VarChar(100), input.hostname)
				.input("lab", sql.VarChar(50), input.lab)
				.input("bench_number", sql.Int, input.benchNumber)
				.input("maintenance_date", sql.Date, input.maintenanceDate ? new Date(input.maintenanceDate) : null)
				.input("status", sql.VarChar(20), input.status)
				.input("assignee", sql.VarChar(100), input.assignee ?? null)
				.input("assignee_type", sql.VarChar(20), input.assigneeType ?? null).query(`
          INSERT INTO machines (hostname, lab, bench_number, maintenance_date, status, assignee, assignee_type)
          OUTPUT INSERTED.*
          VALUES (@hostname, @lab, @bench_number, @maintenance_date, @status, @assignee, @assignee_type)
        `);
			return rowToMachine(result.recordset[0]);
		},

		async updateMachine(id, input) {
			const keys = Object.keys(input) as (keyof typeof input)[];
			if (keys.length === 0) return client.getMachine(id);

			const setClauses: string[] = [];
			const request = pool.request().input("id", sql.Int, id);

			const colMap: Record<string, string> = {
				hostname: "hostname",
				lab: "lab",
				benchNumber: "bench_number",
				maintenanceDate: "maintenance_date",
				status: "status",
				assignee: "assignee",
				assigneeType: "assignee_type",
			};

			for (const key of keys) {
				const col = colMap[key];
				if (!col) continue;
				const val = input[key];
				setClauses.push(`${col} = @${col}`);
				if (val === undefined || val === null) {
					request.input(col, sql.VarChar(100), null);
				} else if (col === "bench_number") {
					request.input(col, sql.Int, val);
				} else if (col === "maintenance_date") {
					request.input(col, sql.Date, new Date(val as string));
				} else {
					request.input(col, sql.VarChar(100), val);
				}
			}

			if (setClauses.length === 0) return client.getMachine(id);

			const result = await request.query(`
          UPDATE machines SET ${setClauses.join(", ")}
          OUTPUT INSERTED.*
          WHERE id = @id
        `);
			return result.recordset[0] ? rowToMachine(result.recordset[0]) : null;
		},

		async deleteMachine(id) {
			const result = await pool.request().input("id", sql.Int, id).query("DELETE FROM machines WHERE id = @id");
			return result.rowsAffected[0] > 0;
		},
	};

	return client;
}
