# Setup — Active Directory (192.168.1.10)

## Contexto

El backend usa LDAP para autenticar usuarios. El flujo es:
1. Usuario ingresa `username` + `password` en el frontend
2. Backend se conecta al AD con un usuario de servicio (`svc-inventario`)
3. Busca el usuario por `sAMAccountName`
4. Verifica la contraseña haciendo bind con el DN del usuario
5. Lee los grupos (`memberOf`) y los mapea a roles de la app

**Los roles de la app dependen 100% de los nombres de los grupos en el AD.**

---

## 1. Verificar el dominio

En PowerShell dentro de la VM:

```powershell
(Get-ADDomain).DistinguishedName
# Debe decir: DC=itu,DC=local
```

Si dice otra cosa, actualizar `LDAP_SEARCH_BASE` y `LDAP_BIND_DN` en `k8s/backend/secret.yaml`.

---

## 2. Crear los grupos requeridos

La app espera estos nombres de grupo **exactos**. Si tienen otro nombre, el usuario queda con rol `readonly`.

En **Active Directory Users and Computers → tu OU o CN=Users → New → Group**:

| Nombre del grupo | Rol en la app | Descripción sugerida |
|---|---|---|
| `GRP_Sysadmin` | sysadmin | Administradores del sistema |
| `GRP_Manager` | manager | Gestores de laboratorio |
| `GRP_Editor` | editor | Editores de inventario |
| `GRP_Operator` | operator | Operadores |
| `GRP_ReadOnly` | readonly | Solo lectura |

Configuración de cada grupo:
- **Group scope:** Global
- **Group type:** Security

O en PowerShell:

```powershell
$groups = @("GRP_Sysadmin","GRP_Manager","GRP_Editor","GRP_Operator","GRP_ReadOnly")
foreach ($g in $groups) {
    New-ADGroup -Name $g -GroupScope Global -GroupCategory Security
}
```

---

## 3. Crear el usuario de servicio para bind LDAP

Este usuario lo usa el backend para conectarse al AD y buscar usuarios. No es un usuario real, es una cuenta de servicio.

En **Active Directory Users and Computers → CN=Users → New → User**:

| Campo | Valor |
|---|---|
| First name | `svc-inventario` |
| User logon name | `svc-inventario` |
| Password | elegir uno seguro |
| ☑ Password never expires | activado |
| ☐ User must change password | desactivado |

O en PowerShell:

```powershell
New-ADUser -Name "svc-inventario" `
  -SamAccountName "svc-inventario" `
  -UserPrincipalName "svc-inventario@itu.local" `
  -AccountPassword (ConvertTo-SecureString "ElPasswordQueElijas" -AsPlainText -Force) `
  -Enabled $true `
  -PasswordNeverExpires $true
```

---

## 4. Asignar usuarios existentes a los grupos

Para que un usuario pueda loguearse en la app con un rol, tiene que estar en uno de los grupos del paso 2.

En **Active Directory Users and Computers → clic derecho en el usuario → Properties → Member Of → Add**:

O en PowerShell:

```powershell
# Ejemplo: agregar jperez como sysadmin
Add-ADGroupMember -Identity "GRP_Sysadmin" -Members "jperez"
```

Un usuario solo necesita estar en **un grupo** — el primer match en este orden determina el rol:
`GRP_Sysadmin` → `GRP_Manager` → `GRP_Editor` → `GRP_Operator` → `GRP_ReadOnly`

---

## 5. Abrir puerto LDAP en el firewall de Windows

```
Windows Defender Firewall
→ Inbound Rules → New Rule
→ Port → TCP → 389 → Allow the connection
→ Name: "LDAP 389"
```

---

## 6. Verificar conectividad desde la VM Linux

```bash
nc -zv 192.168.1.10 389
# Connection to 192.168.1.10 389 port [tcp/*] succeeded!
```

---

## 7. Valores finales para k8s/backend/secret.yaml

```yaml
LDAP_URL: "ldap://192.168.1.10:389"
LDAP_SEARCH_BASE: "DC=itu,DC=local"
LDAP_BIND_DN: "CN=svc_egi_ldap,OU=EGI,DC=itu,DC=local"
LDAP_BIND_PASSWORD: "EgiLdap2026!"
LDAP_SEARCH_FILTER: "(sAMAccountName={username})"
```

---

## 8. Verificar que la autenticación funciona

Desde la VM Linux, con el cluster corriendo:

```bash
curl -s -X POST http://localhost:30080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"jperez","password":"su-password-real"}' | jq .
# Debe devolver token + role del usuario
```

✅ **Autenticación verificada** — el backend se conecta al AD real (`192.168.1.10:389`) y rechaza usuarios inválidos con `"LDAP authentication failed: User not found in AD"`. Los intentos fallidos se registran en los logs del backend.
