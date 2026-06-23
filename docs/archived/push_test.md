# Push Test

Documento de verificación para validar el pipeline de deploy.

## Checklist

| Paso | Estado |
|------|--------|
| Push a `main` | Pendiente |
| CI pasa (lint + typecheck + build) | Pendiente |
| Deploy Core se ejecuta | Pendiente |
| Secrets se inyectan correctamente | Pendiente |
| Seed Data completa | Pendiente |
| Smoke test pasa | Pendiente |

## Secrets requeridos

Verificar en GitHub → Settings → Secrets and variables → Actions:

```
SQL_*        → 6 secrets
MONGO_*      → 4 secrets
LDAP_*       → 5 secrets
JWT_SECRET   → 1 secret
```

Total: 16 secrets

## Uso

```bash
git checkout main
git add .
git commit -m "ci: verificar deploy con GitHub Secrets"
git push origin main
```
