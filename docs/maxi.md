# Procedimiento — Resolver error 15151 en SQL Server

## Síntoma

```sql
ALTER LOGIN sa ENABLE;
-- Error 15151: No se puede modificar el login 'sa' porque no existe o no tienes permisos
```

**Causa:** el usuario con el que conectás SSMS no tiene rol `sysadmin` en SQL Server.

## Requisitos

- Acceso RDP a `ITUSRV002` (SQL Server VM, `192.168.1.20`)
- Usuario Administrador local en la VM

---

## Paso a paso

### 1. Detener SQL Server

Abrí **cmd como Administrador** y ejecutá:

```cmd
net stop MSSQLSERVER
```

### 2. Arrancar en modo single-user

```cmd
net start MSSQLSERVER /m
```

El flag `/m` arranca SQL Server en modo monousuario. En este modo, el Administrador local de Windows tiene acceso como sysadmin sin importar los permisos configurados.

### 3. Conectar SSMS y ejecutar los comandos

Abrí **SQL Server Management Studio** como Administrador:
- Clic derecho → Run as Administrator
- Server type: Database Engine
- Server name: `.` (punto, representa localhost)
- Authentication: **Windows Authentication**
- Connect

Abrí una nueva query y ejecutá:

```sql
-- Habilitar modo mixto (SQL + Windows Authentication)
EXEC xp_instance_regwrite N'HKEY_LOCAL_MACHINE',
   N'Software\Microsoft\MSSQLServer\MSSQLServer',
   N'LoginMode', REG_DWORD, 2;

-- Habilitar login sa y asignarle password
ALTER LOGIN sa WITH PASSWORD = 'Mysql123';
ALTER LOGIN sa ENABLE;

-- Asignar sa al rol sysadmin
EXEC sp_addsrvrolemember 'sa', 'sysadmin';
```

> **Nota:** estos comandos NO dependen del idioma de Windows. Funcionan igual en inglés, español, etc.

### 4. Reiniciar SQL Server normalmente

Cerramos la conexión de SSMS y en el cmd ejecutamos:

```cmd
net stop MSSQLSERVER
net start MSSQLSERVER
```

### 5. Verificar desde la VM Linux

Desde la consola de la VM Linux (`192.168.1.50`), dentro del repositorio clonado:

```bash
cd backend
npm ci
SQL_SERVER=192.168.1.20 SQL_USER=sa SQL_PASSWORD=Mysql123 SQL_DATABASE=inventario_itu node scripts/bootstrap.mjs
```

Si todo sale bien, el script crea la base `inventario_itu` y la tabla `machines`.

---

## Alternativa rápida sin SSMS

Si no tenés SSMS instalado, todo el paso 3 se puede hacer desde `sqlcmd` en el cmd:

```cmd
sqlcmd -S . -Q "EXEC xp_instance_regwrite N'HKEY_LOCAL_MACHINE', N'Software\Microsoft\MSSQLServer\MSSQLServer', N'LoginMode', REG_DWORD, 2; ALTER LOGIN sa WITH PASSWORD = 'Mysql123'; ALTER LOGIN sa ENABLE; EXEC sp_addsrvrolemember 'sa', 'sysadmin';"
```

---

## Referencias

- Documentación SQL Server: `docs/despliegue/scripts/sql-server.md`
- Hostname VM: `ITUSRV002`
- IP: `192.168.1.20`
