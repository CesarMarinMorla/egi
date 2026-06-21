# Setup — SQL Server (ITUSRV002 / 192.168.1.20)

## 1. Habilitar autenticación mixta

En SSMS, clic derecho en el servidor → **Properties → Security**:
- Seleccionar **SQL Server and Windows Authentication mode**
- OK → reiniciar el servicio SQL Server

## 2. Habilitar el usuario SA

```sql
ALTER LOGIN sa ENABLE;
ALTER LOGIN sa WITH PASSWORD = 'Mysql123';
```

## 3. Habilitar TCP/IP

```
SQL Server Configuration Manager
→ SQL Server Network Configuration
→ Protocols for MSSQLSERVER
→ TCP/IP → Enable
→ Reiniciar servicio: SQL Server (MSSQLSERVER)
```

## 4. Abrir puerto en el firewall de Windows

```
Windows Defender Firewall
→ Inbound Rules → New Rule
→ Port → TCP → 1433 → Allow
→ Name: "SQL Server 1433"
```

## 5. Verificar conectividad desde la VM Linux

```bash
nc -zv 192.168.1.20 1433
# Connection to 192.168.1.20 1433 port [tcp/*] succeeded!
```

## 6. Correr bootstrap (desde la VM Linux, en el repo clonado)

```bash
cd backend
npm ci
SQL_SERVER=192.168.1.20 SQL_USER=sa SQL_PASSWORD=Mysql123 SQL_DATABASE=inventario_itu node scripts/bootstrap.mjs
```

✅ **Bootstrap ya ejecutado.** La tabla `machines` existe con 12 registros de seed. Solo re-ejecutar con `FORCE_RESET=true` si se necesita un reset.

## 7. Verificar

```bash
# Desde la VM Linux, en backend/
SQL_SERVER=192.168.1.20 SQL_USER=sa SQL_PASSWORD=Mysql123 SQL_DATABASE=inventario_itu node -e "
const sql = require('mssql');
async function check() {
  await sql.connect({
    server: process.env.SQL_SERVER, port: 1433,
    user: process.env.SQL_USER, password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DATABASE,
    options: { encrypt: false, trustServerCertificate: true }
  });
  const tables = await sql.query('SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_CATALOG = DB_NAME()');
  console.log('Tablas:', tables.recordset.map(t => t.TABLE_NAME));
  const count = await sql.query('SELECT COUNT(*) AS cnt FROM machines');
  console.log('Registros en machines:', count.recordset[0].cnt);
  await sql.close();
}
check().catch(e => { console.error(e.message); process.exit(1); });
"
```

Salida verificada (18/06/2026):
```
Tablas: [ 'machines' ]
Registros en machines: 12
```
