# Seguimiento de tareas

## 1. 🟢 Listo — Infraestructura base

- [x] pfSense: regla NAT (puerto 80 → `192.168.1.50:30080`)
- [x] VM Linux con Minikube, Docker, Calico, iptables persistence
- [x] NodePort 30080 expuesto y accesible desde la LAN
- [x] Reglas iptables host: DNAT, FORWARD, DOCKER-USER (script `k8s/setup-host-networking.sh`)
- [x] Persistencia de reglas iptables post-reboot (systemd)
- [x] Smoke test CI/CD post-deploy en `.github/workflows/deploy.yml`
- [x] GitHub Secrets configurados en UI de GitHub
- [x] Deploy manual en Minikube (build + kubectl apply, modo mock)
- [x] Frontend accesible desde AD (`192.168.1.10`) y Lubuntu (`192.168.1.x`)
- [x] Conectividad AD verificada — ping, puertos 389 y 636 funcionan

## 2. 🟡 Listo — Seguridad aplicada (commits en `develop`)

Estos cambios están commiteados en `develop` y ya pueden deployarse manualmente en el cluster:

- [x] JWT_SECRET obligatorio por env (crashea si falta)
- [x] CORS restringido por `CORS_ORIGINS` env var
- [x] Helmet middleware agregado
- [x] JWT con claims `aud` e `iss`
- [x] RBAC faltante en `PUT /hardware/:machineId` corregido
- [x] Logging de intentos de login fallidos
- [x] Escape de inputs LDAP (inyección)
- [x] Default `ldaps://` en vez de `ldap://` (pero secret actual usa `ldap://`)
- [x] Validación de bind credentials al startup (solo si `MOCK_MODE=false`)
- [x] `SQL_ENCRYPT` default `true` (pero secret lo overridea a `false`)
- [x] `sanitizeInput` aplicado en validación Zod del frontend
- [x] Docker Compose: sin password default, puertos bindeados a `127.0.0.1`
- [x] `.env.example` completo con todas las variables

## 3. 🟢 Roadblocks resueltos

- [x] **SQL Server** (`ITUSRV002 / 192.168.1.20:1433`) — ping, puerto 1433, DB `inventario_itu`, tabla `machines` y seed data (12 registros) verificados
- [x] **Active Directory** — bind credentials configurados en secret, autenticación real funcionando

Con SQL Server + AD funcionando, ya no hay roadblocks para el setup inicial.

## 4. ⏳ Pendiente — No bloquea setup inicial

### Próximo paso

- [x] **Merge `develop` → `main`** — completado
- [x] **Deploy core + seed separados** — `k8s/deploy-core.sh` + `k8s/seed-data.sh`
- [x] **MongoDB bootstrap automático** — Job idempotente `k8s/mongo/seed-job.yaml` + Network Policies
- [x] **Deploy manual desde `main` con modo real** — minikube delete → start → deploy-core → seed-data ✅ verificado
- [x] **Pruebas de gestión de usuarios (modo real)** — login sysadmin, listar 20 usuarios AD, crear usuario (falla por permisos AD, documentado en `docs/testing/pruebas-usuarios.md`)
- [x] **Grupos AD con sufijo por laboratorio** — `GRP_Editor_Lab101`, `GRP_Operator_Lab102`, etc. con validación frontend actualizada
- [x] **Sincronización de grupos en updateUser** — remueve al usuario de grupos viejos y lo agrega a los nuevos al editar
- [x] **Búsqueda LDAP scoped a OU=EGI** — `listUsers()` ahora busca dentro de `OU=EGI,DC=itu,DC=local`
- [x] **Integración AD con SQL Server** — script `database/sql/ad-sqlserver-logins.sql`
- [x] **Creación de usuarios desde el frontend en `OU=EGI`**

### Próximo sprint (testing)

- [ ] Setup Vitest + React Testing Library en frontend
- [ ] Ampliar cobertura de tests backend
- [ ] Tests de integración mock

### Próximo sprint (seguridad)

- [ ] Rate limiting en `/api/auth/login` (express-rate-limit, auto-desactivado en mock)
- [x] MongoDB auth en docker-compose (init script + credenciales)
- [x] Sincronizar `docs/seguridad.md` con cambios ya aplicados

### Próximo sprint (calidad)

- [x] MachineDetail: usar `Promise.allSettled` para carga resiliente aunque falle una API
- [x] MachineDetail: acortar mensaje de error sin acceso
- [ ] Corregir typo en healthcheck docker-compose: `sqlservr` → `sqlservr`
- [ ] Agregar confirmación en `FORCE_RESET` de bootstrap.mjs
- [ ] Agregar `.nvmrc` con `20` en la raíz

### Investigación

- [ ] SealedSecrets para K8s (spike en Minikube local)
- [ ] Política de rate limiting para producción
- [ ] Estándar de contraseñas para servicios

## 5. 🔵 Producción (post-setup)

- [ ] pfSense NAT reflection para acceso desde host Windows
- [ ] HTTPS (TLS termination en pfSense o nginx)
- [x] MongoDB auth en el cluster
- [ ] CSRF protection (evaluar si aplica con Bearer tokens)
- [x] Documentar configuración de MongoDB en producción

## Información confirmada

- [x] **Dominio AD:** `itu.local`
- [x] **Atributo de login LDAP:** `sAMAccountName`
- [x] **Usuario de servicio bind LDAP:** `CN=svc_egi_ldap,OU=EGI,DC=itu,DC=local` / `EgiLdap2026!`
- [ ] **HTTPS:** pendiente de confirmar si el examen lo requiere
