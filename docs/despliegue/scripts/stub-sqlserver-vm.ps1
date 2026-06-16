param(
    [string]$SqlPassword = "Mysql123",
    [string]$SqlPort = "1433",
    [string]$DbName = "inventario_itu",
    [string]$SaPassword = "Mysql123"
)

Write-Host "=== Stub: Configuración de VM SQL Server ===" -ForegroundColor Cyan
Write-Host "IP destino: 192.168.1.20" -ForegroundColor Yellow
Write-Host ""

Write-Host "1. Habilitar autenticación mixta (SQL Server + Windows)" -ForegroundColor Green
Write-Host "   - SSMS > Propiedades del servidor > Seguridad"
Write-Host "   - Seleccionar 'Modo de autenticación de SQL Server y Windows'"
Write-Host ""

Write-Host "2. Habilitar usuario SA" -ForegroundColor Green
$saQuery = @"
ALTER LOGIN sa ENABLE;
ALTER LOGIN sa WITH PASSWORD = '$SaPassword';
"@
Write-Host "   Script:"
Write-Host $saQuery
Write-Host ""

Write-Host "3. Habilitar TCP/IP" -ForegroundColor Green
Write-Host "   - SQL Server Configuration Manager"
Write-Host "   - SQL Server Network Configuration > Protocols for MSSQLSERVER"
Write-Host "   - TCP/IP > Enable"
Write-Host "   - Reiniciar servicio SQL Server (MSSQLSERVER)"
Write-Host ""

Write-Host "4. Abrir puerto $SqlPort en firewall" -ForegroundColor Green
try {
    New-NetFirewallRule -DisplayName "SQL Server $SqlPort" `
        -Direction Inbound -Protocol TCP -LocalPort $SqlPort -Action Allow `
        -ErrorAction Stop
    Write-Host "   Regla de firewall creada"
}
catch {
    Write-Host "   Ejecutar manualmente:"
    Write-Host "   New-NetFirewallRule -DisplayName 'SQL Server $SqlPort' -Direction Inbound -Protocol TCP -LocalPort $SqlPort -Action Allow"
}
Write-Host ""

Write-Host "5. Crear base de datos $DbName" -ForegroundColor Green
$dbQuery = @"
CREATE DATABASE [$DbName];
USE [$DbName];
CREATE TABLE machines (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(255) NOT NULL,
    tipo NVARCHAR(100),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);
"@
Write-Host "   Script:"
Write-Host $dbQuery
Write-Host ""

Write-Host "6. Verificar conectividad desde VM Linux (192.168.1.50):" -ForegroundColor Yellow
Write-Host "   nc -zv 192.168.1.20 $SqlPort"
Write-Host ""

Write-Host "=== Stub completado ===" -ForegroundColor Cyan
Write-Host "Ejecutar bootstrap desde VM Linux:"
Write-Host "cd backend && npm ci && SQL_SERVER=192.168.1.20 SQL_USER=sa SQL_PASSWORD=$SaPassword SQL_DATABASE=$DbName node scripts/bootstrap.mjs"
