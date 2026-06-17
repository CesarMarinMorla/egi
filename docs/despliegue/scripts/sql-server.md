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

Debe crear la tabla `machines` en la base `inventario_itu`.
