import { MongoClient, Db } from "mongodb";
import type { Hardware, HardwareInput } from "../types/index.js";

export interface IMongoClient {
	getHardware(machineId: number): Promise<Hardware | null>;
	saveHardware(machineId: number, input: HardwareInput): Promise<Hardware>;
	deleteHardware(machineId: number): Promise<boolean>;
}

export async function createMongoClient(): Promise<IMongoClient> {
	const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017";
	const dbName = process.env.MONGO_DB_NAME || "inventario";

	const client = new MongoClient(mongoUri);
	try {
		await client.connect();
	} catch (error) {
		throw new Error(`MongoDB connection failed: ${error instanceof Error ? error.message : "Unknown error"}`);
	}

	const db: Db = client.db(dbName);
	const collection = db.collection<Hardware>("hardware");

	return {
		async getHardware(machineId: number): Promise<Hardware | null> {
			const doc = await collection.findOne({ machineId });
			return doc;
		},

		async saveHardware(machineId: number, input: HardwareInput): Promise<Hardware> {
			const hardware: Hardware = { machineId, ...input };
			await collection.updateOne({ machineId }, { $set: hardware }, { upsert: true });
			return hardware;
		},

		async deleteHardware(machineId: number): Promise<boolean> {
			const result = await collection.deleteOne({ machineId });
			return result.deletedCount > 0;
		},
	};
}
