# Seguimiento de tareas

## 1. Red e infraestructura

- [x] pfSense: regla NAT (puerto 80 → `192.168.1.50:30080`)
- [x] VM Linux con Minikube, Docker, Calico, iptables persistence
- [ ] pfSense: verificar NAT reflection para acceso desde host Windows
- [ ] Conectividad SQL Server (`192.168.1.102:1433`) — ping y puerto fallan

## 2. Minikube / Kubernetes

- [x] NodePort 30080 expuesto desde el host
- [x] Reglas iptables host: DNAT, FORWARD, DOCKER-USER (script `k8s/setup-host-networking.sh`)
- [x] Persistencia de reglas iptables post-reboot (systemd)
- [x] Smoke test CI/CD post-deploy en `.github/workflows/deploy.yml`
- [ ] Configurar GitHub Secrets (SQL_SERVER, SQL_PASSWORD, etc.) para modo no-mock
- [ ] Merge `develop` → `main` para activar pipeline en self-hosted runner

## 3. Documentación

- [x] docs/ reestructurada (arquitectura/, despliegue/, incidentes/, testing/ separados)
- [x] TASKS.md unificado (este archivo)
- [ ] Documentar configuración de Mongo en producción (persistencia, backups)

## 4. Seguridad (post-despliegue funcional)

### 4.1 Inmediato (antes de productive)

- [ ] JWT secret fuerte y por variable de entorno
- [ ] Rate limiting en `/api/auth/login`
- [ ] helmet middleware
- [ ] CORS restringido
- [ ] Validación server-side (Zod)
- [ ] RBAC faltante en `PUT /hardware/:machineId`

### 4.2 Antes de conectar AD real

- [ ] Escapar inputs LDAP (inyección)
- [ ] LDAPS en vez de LDAP
- [ ] Validar bind credentials en startup
- [ ] SealedSecrets para K8s

### 4.3 Con pfSense en producción

- [ ] HTTPS (TLS termination en pfSense o nginx)
- [ ] `SQL_ENCRYPT=true`
- [ ] MongoDB auth + TLS
- [ ] CSRF protection
- [ ] Logging de eventos de seguridad
- [ ] No exponer puertos de bases de datos al host

## Información pendiente de confirmar

- [ ] Dominio AD exacto (se asume `itu.local`)
- [ ] Atributo de login LDAP: `sAMAccountName` o `userPrincipalName`
- [ ] Usuario de servicio para bind LDAP (nombre y password)
- [ ] Si el examen requiere HTTPS
