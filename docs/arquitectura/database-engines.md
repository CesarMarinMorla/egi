# Diferencias entre motores de base de datos

## Propósito

Este proyecto usa **SQL Server** en producción (VM con SSMS).  
Para desarrollo local en Apple Silicon se usa **Azure SQL Edge** (alternativa ARM-native).

MySQL no forma parte del stack, pero se incluye como referencia.

---

## Visión general

| Aspecto | MySQL | Azure SQL Edge | SQL Server (SSMS) |
|---------|-------|---------------|-------------------|
| Arquitectura | MySQL | SQL Server branch | SQL Server full |
| ARM64 native | ✅ Sí | ✅ Sí | ❌ Solo x86 |
| Engine usado en este proyecto | ❌ No | ✅ Dev local | ✅ Producción |
| Tamaño Docker (~) | 200 MB | 500 MB | 1.5 GB |
| Consumo RAM (~) | 150 MB | 250 MB | 500 MB+ |

---

## Sintaxis relevante para el schema

| Característica | MySQL | Azure SQL Edge | SQL Server |
|---------------|-------|---------------|------------|
| Auto‑increment | `AUTO_INCREMENT` | `IDENTITY(1,1)` | `IDENTITY(1,1)` |
| Batch separator | `;` | `GO` (sqlcmd) | `GO` (sqlcmd) |
| Crear DB | `CREATE DATABASE` | `CREATE DATABASE` | `CREATE DATABASE` |
| CHECK constraint | ✅ | ✅ | ✅ |
| `OUTPUT INSERTED.*` | ❌ | ✅ | ✅ |
| Tablas temporales | ✅ | ✅ | ✅ |
| Secuencias | ❌ (AUTO_INCREMENT) | `SEQUENCE` | `SEQUENCE` |
| Funciones ventana | ✅ | Parcial | ✅ |

**Conclusión práctica:** el schema de `database/sql/schema.sql` está escrito en T-SQL (`IDENTITY`, `GO`, `CHECK`) y funciona igual en Azure SQL Edge y SQL Server. MySQL requeriría reescribirlo.

---

## Comportamiento con el driver `mssql` (Node.js)

| Característica | MySQL (`mysql2`) | Azure SQL Edge (`mssql`) | SQL Server (`mssql`) |
|---------------|-----------------|-------------------------|---------------------|
| Driver | `mysql2` | `mssql` (tedious) | `mssql` (tedious) |
| Connection string | `mysql://user:pass@host/db` | `Server=host,port;User=...` | Misma |
| `sql.Date` input | N/A (usa `YYYY-MM-DD`) | Acepta `Date` o `string` | Acepta `Date` o `string` |
| RETURNING clause | No | `OUTPUT INSERTED.*` | `OUTPUT INSERTED.*` |
| Columnas devueltas | `camelCase` (si se configura) | `snake_case` (raw) | `snake_case` (raw) |

**Clave:** el código (`sqlClient.ts`) mapea `snake_case → camelCase` manualmente porque `mssql` devuelve los nombres de columna tal cual vienen de la DB, a diferencia de un ORM.

---

## Transición de local a producción

| Aspecto | Local (Apple Silicon) | Producción (VM x86) |
|---------|----------------------|--------------------|
| Imagen Docker | `azure-sql-edge:latest` | No aplica (VM directa) |
| Herramienta admin | No tiene sqlcmd, se usa Node.js/bootstrap | SSMS |
| .env `SQL_SERVER` | `localhost` | IP de la VM |
| .env `SQL_PASSWORD` | `YourPass123` | La de la VM |
| Schema | `database/sql/schema.sql` | Mismo archivo |
| Código backend | Sin cambios | Sin cambios |

**No hay diferencias en el schema ni en el código.** Solo cambian las credenciales en `.env`.

> ⚠️ **Antes de conectar a la VM**, verificar:
> 1. SQL Server en modo **SQL Server + Windows Authentication** (SSMS → Properties → Security)
> 2. Puerto **1433 abierto** en el firewall de la VM
> 3. Backend pueda alcanzar la IP de la VM (`telnet <IP> 1433`)
> 4. Si SQL Server exige SSL, configurar `encrypt: true` y `trustServerCertificate: true`
>
> Detalles paso a paso en [`sql-server.md`](./sql-server.md#9-transición-a-la-vm-ssms--sql-server-real).

---

## Referencia rápida del driver `mssql`

```ts
import sql from 'mssql'

const pool = await sql.connect({
  server: 'localhost',
  port: 1433,
  user: 'sa',
  password: 'YourPass123',
  database: 'inventario_itu',
  options: { encrypt: false },  // true en producción si requiere SSL
})
```

**Tipos de parámetros usados:**

| Columna SQL | Tipo mssql |
|------------|-----------|
| `INT` | `sql.Int` |
| `VARCHAR(n)` | `sql.VarChar(n)` |
| `DATE` | `sql.Date` (pasar `Date` o string ISO) |

**RETORNAR filas después de INSERT/UPDATE:**

```sql
INSERT INTO machines (...)
OUTPUT INSERTED.*
VALUES (...)
```

Esto funciona en Azure SQL Edge y SQL Server. En MySQL no existe.
