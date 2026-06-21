# Seguridad — Analisis y hoja de ruta

## Modo actual y contexto

El sistema admite dos modos controlados por `MOCK_MODE`:

- **`true`** (dev/por defecto): autenticacion ignora contrasenas, datos en memoria. Sin conexiones a bases de datos reales.
- **`false`** (real): SQL Server + MongoDB reales, autenticacion contra LDAP/AD.

Esta documentacion separa los problemas en dos categorias: los que aplican **hoy en desarrollo** y los que apareceran **en produccion real con pfSense + AD**.

---

## 1. Problemas presentes hoy (entorno dev)

Estos existen independientemente de `MOCK_MODE`.

### Resueltos

- [x] #1 **Critico**: JWT secret hardcodeado como fallback (`backend/src/config.ts:40`) — se usa variable de entorno, crashea si falta.
- [x] #4 **Alto**: CORS abierto (`backend/src/config.ts:49`) — restringido por `CORS_ORIGINS`.
- [x] #5 **Alto**: Sin helmet middleware (`backend/src/app.ts`) — `helmet()` agregado con headers de seguridad.
- [x] #7 **Medio**: `PUT /api/hardware/:machineId` sin `requirePermission` (`backend/src/routes/hardware.routes.ts:18`) — corregido.
- [x] #8 **Medio**: JWT sin claims `aud` ni `iss` (`backend/src/services/auth.service.ts:14`) — configurados al firmar y verificar.
- [x] #10 **Bajo**: Funcion `sanitizeInput` sin uso (`frontend/src/utils/validation.ts:163-171`) — aplicada en formularios.

### Pendientes

- [ ] #2 **Critico**: Sin rate limiting en login — fuerza bruta ilimitada. Agregar `express-rate-limit` (desactivado en mock).
- [ ] #6 **Alto**: Sin validacion server-side — Zod solo en frontend, backend confia en `req.body`. Agregar middleware de validacion.
- [ ] #9 **Bajo**: Backend expone puerto `3001` al host en Docker. No mapear puerto en desarrollo.

### Otros

- [-] #3 **Critico**: Mock mode ignora contrasenas — aceptable para dev local, documentado como riesgo conocido.

### Notas para testing

Las soluciones marcadas pueden estorbar el testing manual o automatizado si no se implementan con cuidado:

- **Rate limiting**: debe respetar `MOCK_MODE` — si es `true` (modo mock, la contrasena se ignora), el limite se desactiva automaticamente. En modo real, `RATE_LIMIT_MAX` debe ser generoso (ej. 100/min) para pruebas, y restrictivo (5/min) en produccion.
- **CORS**: idealmente controlado por variable de entorno `CORS_ORIGINS`. En dev permite `*` o multiples origenes; en produccion solo el dominio real del frontend. Ya resuelto.
- **Validacion server-side**: las reglas deben replicar exactamente las del frontend (Zod). Si se desfasan, requests validas desde el frontend seran rechazadas.

---

## 2. Problemas que aplican en produccion real (pfSense + AD)

Estos problemas aplican porque el backend en Minikube corre con `MOCK_MODE=false` y se conecta a AD real (`192.168.1.10:389`), SQL Server real (`192.168.1.20:1433`) y MongoDB in-cluster.

### 2.1 Autenticacion y transporte

#### Resueltos

- [x] #11 **Critico**: Inyeccion LDAP en filtro de busqueda (`ldapClient.ts:81`) — escapado.
- [x] #12 **Critico**: Inyeccion LDAP en `getUserById` (`ldapClient.ts:175`) — escapado.
- [x] #16 **Medio**: MongoDB con autenticacion habilitada — activado con `egi_user`.

#### Pendientes

- [ ] #13 **Alto**: Conexion LDAP sin TLS (`ldap://` en el Secret actual, `ldapClient.ts:60`). Codigo ya soporta `ldaps://` por defecto, pero el Secret de produccion usa `ldap://`. Credenciales viajan en texto plano hacia AD real.
- [ ] #14 **Alto**: Sin HTTPS en backend (`server.ts:46`) — todo viaja en texto plano. Terminar TLS en pfSense (WAF) o reverse proxy (nginx).

#### Parciales

- [ ] #15 **Medio**: SQL Server sin conexion cifrada (`config.ts:33-34`). El default en codigo es `encrypt: true`, pero el Secret de produccion lo overridea a `false`.

### 2.2 Gestion de secretos

#### Resueltos

- [x] #18 **Alto**: SA password `Mysql123` como default en docker-compose — ahora se pasa por variable de entorno.
- [x] #19 **Medio**: LDAP bind credentials default a string vacio (`ldapClient.ts:61-62`) — validacion en startup implementada.

#### Pendientes

- [ ] #17 **Critico**: Secretos en texto plano en manifiestos K8s (`k8s/backend/secret.yaml`). JWT, SQL password y LDAP bind password visibles en el repo. Migrar a ExternalSecret o SealedSecret.

### 2.3 Red y firewall (pfSense)

#### Resueltos

- [x] #22 **Medio**: Network policies en K8s bloquean acceso externo — `deny-all-default` + reglas explicitas de egress implementadas.

#### Pendientes

- [ ] #20 **Alto**: Sin HTTPS entre pfSense y el frontend. NodePort 30080 sirve HTTP plano. Configurar regla en pfSense para redirigir puerto 443 -> 30080, o usar Ingress con TLS.
- [ ] #21 **Medio**: MongoDB y SQL Server expuestos al host via docker-compose. En produccion no exponer puertos de bases de datos al host.

### 2.4 Aplicacion

#### Resueltos

- [x] #25 **Bajo**: Logging de intentos fallidos — implementado.

#### Pendientes

- [ ] #23 **Alto**: Sin CSRF protection. Si se usan cookies para auth, implementar double-submit cookie o SameSite=Strict. Evaluar si aplica con Bearer tokens.

#### Otros

- [-] #24 **Medio**: Sin password hashing — no aplica, LDAP maneja la contrasena.

---

## 3. Lo que ya esta bien

- **SQL injection**: no aplica — todas las queries usan parametros (`sql.input()`)
- **Network policies**: default-deny + reglas explicitas para cada flujo
- **RBAC**: middleware de permisos presente en la mayoria de rutas
- **Secretos en `.env`**: correctamente ignorados por git
- **Imagenes**: no se usa `latest` de imagenes no controladas (salvo `mongo:7` en dev)
- **Persistencia de iptables**: las reglas de `setup-host-networking.sh` se guardan en `/etc/iptables/rules.v4` y se restauran al arrancar via `iptables-restore.service` (systemd)
