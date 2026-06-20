param(
    [string]$DomainName = "itu.local",
    [string]$NetBiosName = "ITU",
    [string]$SafeModePassword = "Itu123456!",
    [string]$ServiceUserName = "svc-inventario",
    [string]$ServiceUserPassword = "Itu123456!",
    [string]$LdapPort = "389"
)

Write-Host "=== Stub: Configuración de VM Active Directory ===" -ForegroundColor Cyan
Write-Host "IP destino: 192.168.1.10" -ForegroundColor Yellow
Write-Host ""

Write-Host "1. Verificar dominio AD" -ForegroundColor Green
try {
    $domain = (Get-ADDomain).DistinguishedName
    Write-Host "   Dominio actual: $domain"
}
catch {
    Write-Host "   AD no detectado. Instalar AD DS si es necesario:"
    Write-Host "   Install-WindowsFeature -Name AD-Domain-Services -IncludeManagementTools"
    Write-Host "   Luego promover a DC: Install-ADDSForest -DomainName '$DomainName' -DomainNetbiosName '$NetBiosName' -SafeModeAdministratorPassword (ConvertTo-SecureString '$SafeModePassword' -AsPlainText -Force)"
}
Write-Host ""

Write-Host "2. Crear grupos requeridos" -ForegroundColor Green
$groups = @("GRP_Sysadmin", "GRP_Manager", "GRP_Editor_Lab101", "GRP_Editor_Lab102", "GRP_Editor_Lab201", "GRP_Operator_Lab101", "GRP_Operator_Lab102", "GRP_Operator_Lab201", "GRP_ReadOnly_Lab101", "GRP_ReadOnly_Lab102", "GRP_ReadOnly_Lab201")
Write-Host "   Grupos a crear: $($groups -join ', ')"
Write-Host "   Script:"
$groupScript = @"
foreach (`$g in @($(($groups | ForEach-Object { "'$_'" }) -join ', '))) {
    New-ADGroup -Name `$g -GroupScope Global -GroupCategory Security -Path "CN=Users,$(if ($domain) { $domain } else { 'DC=itu,DC=local' })"
}
"@
Write-Host $groupScript
Write-Host ""

Write-Host "3. Crear usuario de servicio $ServiceUserName" -ForegroundColor Green
Write-Host "   Script:"
$svcScript = @"
New-ADUser -Name "$ServiceUserName" `
    -SamAccountName "$ServiceUserName" `
    -UserPrincipalName "$ServiceUserName@$DomainName" `
    -AccountPassword (ConvertTo-SecureString "$ServiceUserPassword" -AsPlainText -Force) `
    -Enabled `$true `
    -PasswordNeverExpires `$true
"@
Write-Host $svcScript
Write-Host ""

Write-Host "4. Abrir puerto LDAP ($LdapPort) en firewall" -ForegroundColor Green
try {
    New-NetFirewallRule -DisplayName "LDAP $LdapPort" `
        -Direction Inbound -Protocol TCP -LocalPort $LdapPort -Action Allow `
        -ErrorAction Stop
    Write-Host "   Regla de firewall creada"
}
catch {
    Write-Host "   Ejecutar manualmente:"
    Write-Host "   New-NetFirewallRule -DisplayName 'LDAP $LdapPort' -Direction Inbound -Protocol TCP -LocalPort $LdapPort -Action Allow"
}
Write-Host ""

Write-Host "5. Valores para k8s/backend/secret.yaml:" -ForegroundColor Yellow
Write-Host @"

  LDAP_URL: "ldap://192.168.1.10:$LdapPort"
  LDAP_SEARCH_BASE: "DC=$(($DomainName -split '\.')[0]),DC=$(($DomainName -split '\.')[1])"
  LDAP_BIND_DN: "CN=$ServiceUserName,CN=Users,DC=$(($DomainName -split '\.')[0]),DC=$(($DomainName -split '\.')[1])"
  LDAP_BIND_PASSWORD: "$ServiceUserPassword"
  LDAP_SEARCH_FILTER: "(sAMAccountName={username})"
"@
Write-Host ""

Write-Host "6. Verificar conectividad desde VM Linux (192.168.1.50):" -ForegroundColor Yellow
Write-Host "   nc -zv 192.168.1.10 $LdapPort"
Write-Host ""

Write-Host "=== Stub completado ===" -ForegroundColor Cyan
Write-Host "Luego verificar autenticacion desde la app:"
Write-Host "curl -X POST http://localhost:30080/api/auth/login -H 'Content-Type: application/json' -d '{\"username\":\"jperez\",\"password\":\"su-password\"}'"
