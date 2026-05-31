import dotenv from "dotenv";

dotenv.config();

interface Config {
	port: number;
	jwtSecret: string;
	mockMode: boolean;
	sql: {
		server: string;
		port: number;
		user: string;
		password: string;
		database: string;
		encrypt: boolean;
		trustServerCertificate: boolean;
	};
}

function sqlConfig() {
	const s = (key: string, fallback: string) => process.env[key] ?? fallback;
	const b = (key: string, fallback: string) => {
		const val = process.env[key];
		return val !== undefined ? val === "true" : fallback === "true";
	};
	const parts = (s("SQL_SERVER", "localhost") + "").split(":");
	return {
		server: parts[0],
		port: Number(parts[1]) || 1433,
		user: s("SQL_USER", "sa"),
		password: s("SQL_PASSWORD", ""),
		database: s("SQL_DATABASE", "inventario_itu"),
		encrypt: b("SQL_ENCRYPT", "false"),
		trustServerCertificate: b("SQL_TRUST_SERVER_CERTIFICATE", "true"),
	};
}

const config: Config = {
	port: Number(process.env.PORT) || 3001,
	jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
	mockMode: process.env.MOCK_MODE !== "false",
	sql: sqlConfig(),
};

export default config;
