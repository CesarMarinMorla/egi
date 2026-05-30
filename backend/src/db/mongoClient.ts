import type { Hardware, HardwareInput } from '../types/index.js'

export interface IMongoClient {
  getHardware(machineId: number): Promise<Hardware | null>
  saveHardware(machineId: number, input: HardwareInput): Promise<Hardware>
  deleteHardware(machineId: number): Promise<boolean>
}

export async function createMongoClient(): Promise<IMongoClient> {
  // const client = await MongoClient.connect(process.env.MONGO_URI)
  // return { ... }

  throw new Error('MongoDB no configurado. Usar mock mode.')
}
