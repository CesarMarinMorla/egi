USE master;
GO

-- Crear logins de Windows desde los grupos de AD (solo si no existen)
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'ITU\GRP_Sysadmin')
    CREATE LOGIN [ITU\GRP_Sysadmin] FROM WINDOWS;

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'ITU\GRP_Manager')
    CREATE LOGIN [ITU\GRP_Manager] FROM WINDOWS;

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'ITU\GRP_Editor')
    CREATE LOGIN [ITU\GRP_Editor] FROM WINDOWS;

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'ITU\GRP_Operator')
    CREATE LOGIN [ITU\GRP_Operator] FROM WINDOWS;

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'ITU\GRP_ReadOnly')
    CREATE LOGIN [ITU\GRP_ReadOnly] FROM WINDOWS;
GO

USE inventario_itu;
GO

-- Crear usuarios en la base (solo si no existen)
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'ITU\GRP_Sysadmin')
    CREATE USER [ITU\GRP_Sysadmin] FOR LOGIN [ITU\GRP_Sysadmin];

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'ITU\GRP_Manager')
    CREATE USER [ITU\GRP_Manager] FOR LOGIN [ITU\GRP_Manager];

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'ITU\GRP_Editor')
    CREATE USER [ITU\GRP_Editor] FOR LOGIN [ITU\GRP_Editor];

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'ITU\GRP_Operator')
    CREATE USER [ITU\GRP_Operator] FOR LOGIN [ITU\GRP_Operator];

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'ITU\GRP_ReadOnly')
    CREATE USER [ITU\GRP_ReadOnly] FOR LOGIN [ITU\GRP_ReadOnly];
GO

-- Asignar permisos según grupo
ALTER ROLE db_owner ADD MEMBER [ITU\GRP_Sysadmin];

-- Manager: leer y escribir
ALTER ROLE db_datareader ADD MEMBER [ITU\GRP_Manager];
ALTER ROLE db_datawriter ADD MEMBER [ITU\GRP_Manager];

-- Editor: leer y escribir
ALTER ROLE db_datareader ADD MEMBER [ITU\GRP_Editor];
ALTER ROLE db_datawriter ADD MEMBER [ITU\GRP_Editor];

-- Operator: leer y escribir
ALTER ROLE db_datareader ADD MEMBER [ITU\GRP_Operator];
ALTER ROLE db_datawriter ADD MEMBER [ITU\GRP_Operator];

-- ReadOnly: solo leer
ALTER ROLE db_datareader ADD MEMBER [ITU\GRP_ReadOnly];
GO
