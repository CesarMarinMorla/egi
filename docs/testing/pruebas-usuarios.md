# Pruebas — Gestión de usuarios (modo real)

## Contexto

Backend en Minikube con `MOCK_MODE=false`, autenticando contra AD real (`192.168.1.10:389`).

## 1. Login como sysadmin

```bash
curl -s -X POST http://localhost:30010/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"test_sysadmin","password":"Test2026!"}'
```

**Resultado:** ✅ Token JWT con `role: sysadmin`

```json
{
    "token": "eyJ...",
    "user": {
        "id": "CN=test_sysadmin,OU=EGI,DC=itu,DC=local",
        "username": "test_sysadmin",
        "displayName": "test_sysadmin",
        "role": "sysadmin",
        "labs": []
    }
}
```

## 2. Listar usuarios del AD

```bash
curl -s http://localhost:30010/api/users \
  -H "Authorization: Bearer $TOKEN"
```

**Resultado:** ✅ 20 usuarios devueltos desde el AD

| Username | Rol en app | Estado |
|---|---|---|
| `test_sysadmin` | sysadmin | ✅ GRP_Sysadmin |
| `test_manager` | manager | ✅ GRP_Manager |
| `test_editor` | editor | ✅ GRP_Editor |
| `test_operator` | operator | ✅ GRP_Operator |
| `test_readonly` | readonly | ✅ GRP_ReadOnly |
| `svc_egi_ldap` | readonly | Service account (bind LDAP) |
| `administrador` | readonly | Sin GRP_* (admin del dominio) |
| `soporteit1` | readonly | Usuario real |
| `pedro.calidad` | readonly | Usuario real |
| `luisa.almacen` | readonly | Usuario real |
| `juan.almacen` | readonly | Usuario real |
| `maria.almacen` | readonly | Usuario real |
| `andres.fabrica` | readonly | Usuario real |
| `pfsense_bind` | readonly | Service account pfSense |
| `Invitado` | — | Deshabilitado |
| `krbtgt` | — | Deshabilitado |
| `ITUSRVDC01$` | — | Equipo DC |
| `ITUSRV002$` | — | Equipo SQL Server |
| `CLIENTE$` | — | Equipo |
| `contable1` | — | Deshabilitado |

## 3. Crear usuario

```bash
curl -s -X POST http://localhost:30010/api/users \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "username": "nuevo_user",
    "displayName": "Usuario de Prueba",
    "email": "nuevo@itu.local",
    "groups": ["GRP_Editor"],
    "enabled": true,
    "password": "TempPass123!"
  }'
```

**Resultado:** ❌ `INSUFF_ACCESS_RIGHTS`

```json
{
    "error": "00000005: SecErr: DSID-03152DE3, problem 4003 (INSUFF_ACCESS_RIGHTS), data 0"
}
```

**Causa:** La cuenta de servicio `svc_egi_ldap` (usada por el backend para operaciones LDAP) no tiene permisos de escritura en el Active Directory.

## 4. Login con usuario inexistente

```bash
curl -s -X POST http://localhost:30010/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"nuevo_user","password":"TempPass123!"}'
```

**Resultado:** ✅ (esperado) — `"User not found in AD"`

## 5. Mapeo de roles

| Grupo AD | Rol en app | create users | list users | CRUD inventory |
|---|---|---|---|---|
| `GRP_Sysadmin` | sysadmin | ✅ | ✅ | ✅ |
| `GRP_Manager` | manager | ❌ | ✅ | full CRUD |
| `GRP_Editor` | editor | ❌ | ❌ | create + update |
| `GRP_Operator` | operator | ❌ | ❌ | update |
| `GRP_ReadOnly` | readonly | ❌ | ❌ | solo read |
| *(ninguno)* | readonly | ❌ | ❌ | solo read |

## Conclusión

- **Lectura:** ✅ sysadmin y manager pueden listar usuarios del AD
- **Creación:** ❌ El service account `svc_egi_ldap` no tiene permisos de escritura en AD
- **Login:** ✅ Autenticación LDAP funciona correctamente
- **Listado de roles:** ✅ Los 5 grupos de app están creados y asignados correctamente

Para habilitar creación de usuarios desde la app, habría que delegar permisos de escritura en el AD a `svc_egi_ldap` (no es necesario para el proyecto).
