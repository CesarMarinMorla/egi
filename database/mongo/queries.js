// Queries de ejemplo — colección hardware
// Base de datos: inventario_itu

// 1. Ver todos los documentos
db.hardware.find().pretty()

// 2. Filtrar desktops con más de 8GB de RAM
db.hardware.find(
  { type: "desktop", ramGb: { $gt: 8 } },
  { model: 1, ramGb: 1, manufacturer: 1, _id: 0 }
)

// 3. Buscar por fabricante
db.hardware.find(
  { manufacturer: "Dell" },
  { model: 1, cpu: 1, os: 1, _id: 0 }
)

// 4. Actualizar el sistema operativo de una máquina
db.hardware.updateOne(
  { machineId: 2 },
  { $set: { os: "Windows 11" } }
)

// 5. Eliminar el hardware de una máquina retirada
db.hardware.deleteOne({ machineId: 12 })

// 6. Contar documentos
db.hardware.countDocuments()
