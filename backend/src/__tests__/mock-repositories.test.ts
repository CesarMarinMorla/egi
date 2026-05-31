import { mockMachineRepository } from "../mock/repositories/machine.repository.js";
import type { Machine, MachineInput } from "../types/index.js";

describe("Mock Machine Repository", () => {
	const repository = mockMachineRepository;

	describe("list", () => {
		it("should return all machines", async () => {
			const machines = await repository.list();
			expect(Array.isArray(machines)).toBe(true);
			expect(machines.length).toBeGreaterThan(0);
		});

		it("should return machines with correct structure", async () => {
			const machines = await repository.list();
			const machine = machines[0];
			expect(machine).toHaveProperty("id");
			expect(machine).toHaveProperty("hostname");
			expect(machine).toHaveProperty("lab");
			expect(machine).toHaveProperty("benchNumber");
			expect(machine).toHaveProperty("status");
		});
	});

	describe("getById", () => {
		it("should return a machine by id", async () => {
			const machine = await repository.getById(1);
			expect(machine).not.toBeNull();
			expect(machine?.id).toBe(1);
		});

		it("should return null for non-existent id", async () => {
			const machine = await repository.getById(9999);
			expect(machine).toBeNull();
		});
	});

	describe("create", () => {
		it("should create a new machine", async () => {
			const input: MachineInput = {
				hostname: "test-pc",
				lab: "Lab 101",
				benchNumber: 1,
				maintenanceDate: "2024-01-01",
				status: "active",
			};
			const machine = await repository.create(input);
			expect(machine).toHaveProperty("id");
			expect(machine.hostname).toBe(input.hostname);
			expect(machine.lab).toBe(input.lab);
		});
	});

	describe("update", () => {
		it("should update an existing machine", async () => {
			const input: MachineInput = {
				hostname: "updated-pc",
				lab: "Lab 102",
				benchNumber: 2,
				maintenanceDate: "2024-01-02",
				status: "maintenance",
			};
			const machine = await repository.update(1, input);
			expect(machine).not.toBeNull();
			expect(machine?.hostname).toBe(input.hostname);
		});

		it("should return null for non-existent id", async () => {
			const input: MachineInput = {
				hostname: "test",
				lab: "Lab 101",
				benchNumber: 1,
				maintenanceDate: "2024-01-01",
				status: "active",
			};
			const machine = await repository.update(9999, input);
			expect(machine).toBeNull();
		});
	});

	describe("delete", () => {
		it("should delete an existing machine", async () => {
			const result = await repository.delete(1);
			expect(result).toBe(true);
		});

		it("should return false for non-existent id", async () => {
			const result = await repository.delete(9999);
			expect(result).toBe(false);
		});
	});
});
