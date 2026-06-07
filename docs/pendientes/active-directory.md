# Setup — Active Directory (192.168.1.10)

## 1. Verificar dominio

En PowerShell dentro de la VM:

```powershell
(Get-ADDomain).DistinguishedName
# Esperado: DC=itu,DC=local
```

## 2. Abrir puerto LDAP en el firewall de Windows

```
Windows Defender Firewall
→ Inbound Rules → New Rule
→ Port → TCP → 389 → Allow
→ Name: "LDAP 389"
```

## 3. Crear usuario de servicio para bind LDAP

En **Active Directory Users and Computers**:

```
CN=Users,DC=itu,DC=local
→ New → User
  First name: svc-inventario
  User logon name: svc-inventario
  Password: <password-seguro>
  ☑ Password never expires
  ☐ User must change password at next logon
```

O en PowerShell:

```powershell
New-ADUser -Name "svc-inventario" `
  -SamAccountName "svc-inventario" `
  -UserPrincipalName "svc-inventario@itu.local" `
  -AccountPassword (ConvertTo-SecureString "<password>" -AsPlainText -Force) `
  -Enabled $true `
  -PasswordNeverExpires $true
```

## 4. Confirmar atributo de login

```powershell
# Ver un usuario de prueba
Get-ADUser -Identity <usuario> -Properties sAMAccountName, userPrincipalName
```

Determinar si el login será por `sAMAccountName` (ej. `jperez`) o `userPrincipalName` (ej. `jperez@itu.local`).

## 5. Verificar conectividad desde la VM Linux

```bash
nc -zv 192.168.1.10 389
# Connection to 192.168.1.10 389 port [tcp/*] succeeded!
```

## 6. Valores para el secret

Una vez completado, cargar en `k8s/backend/secret.yaml`:

```yaml
LDAP_URL: "ldap://192.168.1.10:389"
LDAP_BASE_DN: "DC=itu,DC=local"
LDAP_BIND_DN: "CN=svc-inventario,CN=Users,DC=itu,DC=local"
LDAP_BIND_PASSWORD: "<password-del-paso-3>"
LDAP_SEARCH_ATTRIBUTE: "sAMAccountName"   # confirmar en paso 4
```
