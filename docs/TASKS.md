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

## 3. 🔴 Roadblocks — Sin esto no se termina el setup

- [ ] **SQL Server** (`ITUSRV002 / 192.168.1.20:1433`) — ping y puerto 1433 OK. Falta crear DB y bootstrap
- [x] **Active Directory** — bind credentials configurados en secret, autenticación real funcionando
- [ ] **Merge `develop` → `main`** — recién después de tener SQL + AD funcionando en modo real

## 4. ⏳ Pendiente — No bloquea setup inicial

### Próximo sprint (testing)

- [ ] Setup Vitest + React Testing Library en frontend
- [ ] Ampliar cobertura de tests backend
- [ ] Tests de integración mock

### Próximo sprint (seguridad)

- [ ] Rate limiting en `/api/auth/login` (express-rate-limit, auto-desactivado en mock)
- [ ] MongoDB auth en docker-compose (init script + credenciales)
- [ ] Sincronizar `docs/seguridad.md` con cambios ya aplicados

### Próximo sprint (calidad)

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
- [ ] MongoDB auth + TLS en el cluster
- [ ] CSRF protection (evaluar si aplica con Bearer tokens)
- [ ] Documentar configuración de MongoDB en producción

## Información pendiente de confirmar

- [ ] Dominio AD exacto (se asume `itu.local`)
- [ ] Atributo de login LDAP: `sAMAccountName` o `userPrincipalName`
- [ ] Usuario de servicio para bind LDAP (nombre y password)
- [ ] Si el examen requiere HTTPS
