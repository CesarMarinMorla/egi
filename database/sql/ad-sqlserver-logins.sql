USE master;
GO

-- Logins de grupos genéricos
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'ITU\GRP_Sysadmin')
    CREATE LOGIN [ITU\GRP_Sysadmin] FROM WINDOWS;

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'ITU\GRP_Manager')
    CREATE LOGIN [ITU\GRP_Manager] FROM WINDOWS;

-- Logins de grupos con sufijo de laboratorio
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'ITU\GRP_Editor_Lab101')
    CREATE LOGIN [ITU\GRP_Editor_Lab101] FROM WINDOWS;

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'ITU\GRP_Editor_Lab102')
    CREATE LOGIN [ITU\GRP_Editor_Lab102] FROM WINDOWS;

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'ITU\GRP_Editor_Lab201')
    CREATE LOGIN [ITU\GRP_Editor_Lab201] FROM WINDOWS;

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'ITU\GRP_Operator_Lab101')
    CREATE LOGIN [ITU\GRP_Operator_Lab101] FROM WINDOWS;

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'ITU\GRP_Operator_Lab102')
    CREATE LOGIN [ITU\GRP_Operator_Lab102] FROM WINDOWS;

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'ITU\GRP_Operator_Lab201')
    CREATE LOGIN [ITU\GRP_Operator_Lab201] FROM WINDOWS;

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'ITU\GRP_ReadOnly_Lab101')
    CREATE LOGIN [ITU\GRP_ReadOnly_Lab101] FROM WINDOWS;

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'ITU\GRP_ReadOnly_Lab102')
    CREATE LOGIN [ITU\GRP_ReadOnly_Lab102] FROM WINDOWS;

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'ITU\GRP_ReadOnly_Lab201')
    CREATE LOGIN [ITU\GRP_ReadOnly_Lab201] FROM WINDOWS;
GO

USE inventario_itu;
GO

-- Usuarios de grupos genéricos
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'ITU\GRP_Sysadmin')
    CREATE USER [ITU\GRP_Sysadmin] FOR LOGIN [ITU\GRP_Sysadmin];

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'ITU\GRP_Manager')
    CREATE USER [ITU\GRP_Manager] FOR LOGIN [ITU\GRP_Manager];

-- Usuarios de grupos con sufijo de laboratorio
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'ITU\GRP_Editor_Lab101')
    CREATE USER [ITU\GRP_Editor_Lab101] FOR LOGIN [ITU\GRP_Editor_Lab101];

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'ITU\GRP_Editor_Lab102')
    CREATE USER [ITU\GRP_Editor_Lab102] FOR LOGIN [ITU\GRP_Editor_Lab102];

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'ITU\GRP_Editor_Lab201')
    CREATE USER [ITU\GRP_Editor_Lab201] FOR LOGIN [ITU\GRP_Editor_Lab201];

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'ITU\GRP_Operator_Lab101')
    CREATE USER [ITU\GRP_Operator_Lab101] FOR LOGIN [ITU\GRP_Operator_Lab101];

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'ITU\GRP_Operator_Lab102')
    CREATE USER [ITU\GRP_Operator_Lab102] FOR LOGIN [ITU\GRP_Operator_Lab102];

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'ITU\GRP_Operator_Lab201')
    CREATE USER [ITU\GRP_Operator_Lab201] FOR LOGIN [ITU\GRP_Operator_Lab201];

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'ITU\GRP_ReadOnly_Lab101')
    CREATE USER [ITU\GRP_ReadOnly_Lab101] FOR LOGIN [ITU\GRP_ReadOnly_Lab101];

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'ITU\GRP_ReadOnly_Lab102')
    CREATE USER [ITU\GRP_ReadOnly_Lab102] FOR LOGIN [ITU\GRP_ReadOnly_Lab102];

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'ITU\GRP_ReadOnly_Lab201')
    CREATE USER [ITU\GRP_ReadOnly_Lab201] FOR LOGIN [ITU\GRP_ReadOnly_Lab201];
GO

-- Permisos grupos genéricos
ALTER ROLE db_owner ADD MEMBER [ITU\GRP_Sysadmin];
ALTER ROLE db_datareader ADD MEMBER [ITU\GRP_Manager];
ALTER ROLE db_datawriter ADD MEMBER [ITU\GRP_Manager];
GO

-- Permisos grupos Editor
ALTER ROLE db_datareader ADD MEMBER [ITU\GRP_Editor_Lab101];
ALTER ROLE db_datawriter ADD MEMBER [ITU\GRP_Editor_Lab101];
ALTER ROLE db_datareader ADD MEMBER [ITU\GRP_Editor_Lab102];
ALTER ROLE db_datawriter ADD MEMBER [ITU\GRP_Editor_Lab102];
ALTER ROLE db_datareader ADD MEMBER [ITU\GRP_Editor_Lab201];
ALTER ROLE db_datawriter ADD MEMBER [ITU\GRP_Editor_Lab201];
GO

-- Permisos grupos Operator
ALTER ROLE db_datareader ADD MEMBER [ITU\GRP_Operator_Lab101];
ALTER ROLE db_datawriter ADD MEMBER [ITU\GRP_Operator_Lab101];
ALTER ROLE db_datareader ADD MEMBER [ITU\GRP_Operator_Lab102];
ALTER ROLE db_datawriter ADD MEMBER [ITU\GRP_Operator_Lab102];
ALTER ROLE db_datareader ADD MEMBER [ITU\GRP_Operator_Lab201];
ALTER ROLE db_datawriter ADD MEMBER [ITU\GRP_Operator_Lab201];
GO

-- Permisos grupos ReadOnly
ALTER ROLE db_datareader ADD MEMBER [ITU\GRP_ReadOnly_Lab101];
ALTER ROLE db_datareader ADD MEMBER [ITU\GRP_ReadOnly_Lab102];
ALTER ROLE db_datareader ADD MEMBER [ITU\GRP_ReadOnly_Lab201];
GO
