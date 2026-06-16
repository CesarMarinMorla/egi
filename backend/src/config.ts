import dotenv from "dotenv";

dotenv.config();

interface Config {
	port: number;
	jwtSecret: string;
	jwtAudience: string;
	jwtIssuer: string;
	mockMode: boolean;
	corsOrigins: string | string[];
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
		encrypt: b("SQL_ENCRYPT", "true"),
		trustServerCertificate: b("SQL_TRUST_SERVER_CERTIFICATE", "false"),
	};
}

function requireEnv(key: string): string {
	const val = process.env[key];
	if (!val) throw new Error(`Variable de entorno requerida: ${key}`);
	return val;
}

function corsOrigins(): string | string[] {
	const raw = process.env.CORS_ORIGINS;
	if (!raw) return ["http://localhost:5173", "http://localhost:30080"];
	return raw.split(",").map(s => s.trim());
}

const config: Config = {
	port: Number(process.env.PORT) || 3001,
	jwtSecret: requireEnv("JWT_SECRET"),
	jwtAudience: process.env.JWT_AUDIENCE || "inventario-itu",
	jwtIssuer: process.env.JWT_ISSUER || "inventario-backend",
	mockMode: process.env.MOCK_MODE !== "false",
	corsOrigins: corsOrigins(),
	sql: sqlConfig(),
};

export default config;
