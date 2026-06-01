# Seguridad — Análisis y hoja de ruta

## Modo actual y contexto

El sistema admite dos modos controlados por `MOCK_MODE`:

- **`true`** (dev/por defecto): autenticación ignora contraseñas, datos en memoria. Sin conexiones a bases de datos reales.
- **`false`** (real): SQL Server + MongoDB reales, autenticación contra LDAP/AD.

Esta documentación separa los problemas en dos categorías: los que aplican **hoy en desarrollo** y los que aparecerán **en producción real con pfSense + AD**.

---

## 1. Problemas presentes hoy (entorno dev)

Estos existen independientemente de `MOCK_MODE` y deberían corregirse antes de productive.

| #   | Severidad   | Problema                                                                                              | Ubicación                                                | Solución                                                                                                                      |
| --- | ----------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Crítico** | JWT secret hardcodeado como fallback (`dev-secret-change-me`)                                         | `backend/src/config.ts:40`                               | Usar variable de entorno siempre; generar secreto fuerte con `openssl rand -base64 32`                                        |
| 2   | **Crítico** | Sin rate limiting en login — fuerza bruta ilimitada                                                   | Toda la app                                              | Agregar `express-rate-limit` configurable por env: `RATE_LIMIT_MAX` (5 en prod, 100 o desactivado en dev si `MOCK_MODE=true`) |
| 3   | **Crítico** | Mock mode ignora contraseñas — cualquier password funciona                                            | `backend/src/mock/repositories/user.repository.ts:58-65` | Aceptable para dev local, documentar como riesgo conocido                                                                     |
| 4   | **Alto**    | CORS en `*` — cualquier origen puede llamar a la API                                                  | `backend/src/app.ts:26`                                  | Restringir por env: `CORS_ORIGINS` — dev: `http://localhost:5173,http://localhost:30080`; prod: dominio real                  |
| 5   | **Alto**    | Sin helmet — faltan headers de seguridad (CSP, HSTS, X-Frame-Options, etc.)                           | `backend/src/app.ts`                                     | Agregar `helmet` middleware                                                                                                   |
| 6   | **Alto**    | Sin validación server-side — Zod solo en frontend, backend confía en `req.body`                       | Todos los controllers                                    | Agregar middleware de validación con Zod o express-validator                                                                  |
| 7   | **Medio**   | `PUT /api/hardware/:machineId` sin `requirePermission` — cualquier usuario autenticado edita hardware | `backend/src/routes/hardware.routes.ts:18`               | Agregar `requirePermission('update', 'inventory')`                                                                            |
| 8   | **Medio**   | JWT sin claims `aud` ni `iss` — cualquier token firmado es válido para cualquier endpoint             | `backend/src/services/auth.service.ts:14`                | Agregar `audience` e `issuer` al firmar y verificar                                                                           |
| 9   | **Bajo**    | Backend expone puerto `3001` al host en Docker (no en K8s, es ClusterIP)                              | `docker-compose.yml` (no aplica) / Docker run            | No mapear puerto del backend al host en desarrollo                                                                            |
| 10  | **Bajo**    | Función `sanitizeInput` existe en frontend pero no se llama                                           | `frontend/src/utils/validation.ts:163-171`               | Aplicar sanitización en campos de texto antes de renderizar                                                                   |

### Notas para testing

Las soluciones marcadas pueden estorbar el testing manual o automatizado si no se implementan con cuidado:

- **Rate limiting**: debe respetar `MOCK_MODE` — si es `true` (modo mock, la contraseña se ignora), el límite se desactiva automáticamente. En modo real, `RATE_LIMIT_MAX` debe ser generoso (ej. 100/min) para pruebas, y restrictivo (5/min) en producción.
- **CORS**: idealmente controlado por variable de entorno `CORS_ORIGINS`. En dev permite `*` o múltiples orígenes; en producción solo el dominio real del frontend.
- **Validación server-side**: las reglas deben replicar exactamente las del frontend (Zod). Si se desfasan, requests válidas desde el frontend serán rechazadas.

---

## 2. Problemas que aparecerán en producción real (pfSense + AD)

Estos requieren infraestructura y configuración adicionales. No aplican hoy porque no hay AD ni SQL Server externo en el cluster.

### 2.1 Autenticación y transporte

| #   | Severidad   | Problema                                      | Detalle                                                           | Solución                                                                     |
| --- | ----------- | --------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 11  | **Crítico** | Inyección LDAP en filtro de búsqueda          | `ldapClient.ts:81` interpola `username` directamente en el filter | Escapar caracteres especiales LDAP (RFC 4514) antes de interpolar            |
| 12  | **Crítico** | Inyección LDAP en `getUserById`               | `ldapClient.ts:175` interpola `id` en el DN filter                | Usar búsqueda por atributo en vez de interpolación directa                   |
| 13  | **Alto**    | Conexión LDAP sin TLS (`ldap://` por defecto) | `ldapClient.ts:60` — credenciales viajan en texto plano           | Usar `ldaps://` con certificado válido                                       |
| 14  | **Alto**    | Sin HTTPS en backend                          | `server.ts:46` — todo viaja en texto plano                        | Terminar TLS en pfSense (WAF) o en un reverse proxy (nginx)                  |
| 15  | **Medio**   | SQL Server sin conexión cifrada               | `config.ts:33-34` — `encrypt: false` por defecto                  | Forzar `SQL_ENCRYPT=true` y `SQL_TRUST_SERVER_CERTIFICATE=false`             |
| 16  | **Medio**   | MongoDB sin autenticación ni TLS              | `mongoClient.ts:11` — conexión anónima                            | Configurar auth en MongoDB y usar `mongodb://user:pass@host:27017/?tls=true` |

### 2.2 Gestión de secretos

| #   | Severidad   | Problema                                              | Detalle                                                                    | Solución                                                                           |
| --- | ----------- | ----------------------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 17  | **Crítico** | Secretos en texto plano en manifiestos K8s            | `k8s/backend/secret.yaml` — JWT, SQL password visibles en el repo          | Usar `ExternalSecret` o `SealedSecret` con cifrado; nunca commitear secrets reales |
| 18  | **Alto**    | SA password `Mysql123` como default en docker-compose | `docker-compose.yml:8` — password débil del admin de SQL Server            | Generar password fuerte y pasarla vía variable de entorno                          |
| 19  | **Medio**   | LDAP bind credentials default a string vacío          | `ldapClient.ts:61-62` — si no se configura, la autenticación salta el bind | Validar en startup que `LDAP_BIND_DN` y `LDAP_BIND_PASSWORD` estén definidos       |

### 2.3 Red y firewall (pfSense)

| #   | Severidad | Problema                                            | Detalle                                               | Solución                                                                                   |
| --- | --------- | --------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 20  | **Alto**  | Sin HTTPS entre pfSense y el frontend               | El NodePort 30080 sirve HTTP plano                    | Configurar regla en pfSense para redirigir puerto 443 → 30080 (o usar Ingress con TLS)     |
| 21  | **Medio** | MongoDB y SQL Server expuestos al host              | Puertos mapeados en docker-compose para dev           | En prod no exponer puertos de bases de datos al host; solo acceso interno entre containers |
| 22  | **Medio** | Network policies en K8s permiten egress a IPs fijas | SQL (`192.168.56.30:1433`) y AD (`192.168.56.40:389`) | Verificar que pfSense aisle esas VMs y solo el cluster pueda alcanzarlas                   |

### 2.4 Aplicación

| #   | Severidad | Problema                                             | Detalle                                  | Solución                                                                              |
| --- | --------- | ---------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------- |
| 23  | **Alto**  | Sin CSRF protection                                  | No hay token CSRF ni SameSite cookies    | Si se usan cookies para auth, implementar double-submit cookie o SameSite=Strict      |
| 24  | **Medio** | Sin password hashing                                 | No se usa bcrypt/argon2 en ninguna parte | LDAP maneja la contraseña, pero si se implementa auth local, hashear con bcrypt       |
| 25  | **Bajo**  | No hay logging de intentos fallidos de autenticación | Login fallido no se registra             | Agregar logger estructurado que registre intentos fallidos con timestamp, IP, usuario |

---

## 3. Resumen por prioridad

### Inmediato (antes de productive)

```
1.  JWT secret fuerte y por variable de entorno
2.  Rate limiting en /api/auth/login
3.  helmet middleware
4.  CORS restringido
5.  Validación server-side (Zod)
6.  RBAC faltante en PUT /hardware/:machineId
```

### Antes de conectar AD real

```
7.  Escapar inputs LDAP (inyección)
8.  LDAPS en vez de LDAP
9.  Validar bind credentials en startup
10. SealedSecrets para K8s
```

### Con pfSense en producción

```
11. HTTPS (TLS termination en pfSense o nginx)
12. SQL_ENCRYPT=true
13. MongoDB auth + TLS
14. CSRF protection
15. Logging de eventos de seguridad
16. No exponer puertos de bases de datos al host
```

---

## 4. Lo que ya está bien

- **SQL injection**: no aplica — todas las queries usan parámetros (`sql.input()`)
- **Network policies**: default-deny + reglas explícitas para cada flujo
- **RBAC**: middleware de permisos presente en la mayoría de rutas
- **Secretos en `.env`**: correctamente ignorados por git
- **Imágenes**: no se usa `latest` de imágenes no controladas (salvo `mongo:7`)
