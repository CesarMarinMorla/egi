# Revision de produccion — Dia 1

**Fecha:** 2026-06-21
**Entorno:** Minikube (192.168.1.50:30080), MOCK_MODE=false
**Alcance:** Cambios con maximo impacto en 1 dia habil

---

Nota: este documento se enfoca en lo que todavia esta pendiente de resolver.
Los items ya solucionados (inyeccion LDAP, CORS, PUT hardware, JWT aud/iss,
helmet) estan marcados como resueltos en `docs/seguridad.md` y `docs/TASKS.md`.

---

## Prioridad 1 — Implementar antes de seguir en produccion

### JWT secret en produccion

**Archivo:** `backend/src/config.ts` + `k8s/backend/secret.yaml`
**Estimado:** 5 min
**Severidad:** Critica

El fallback en `config.ts` es `dev-secret-change-me`. Si el Secret de Kubernetes no
tiene un valor distinto, cualquiera que conozca esta base puede firmar tokens JWT
validos y saltarse toda la autenticacion.

```bash
kubectl get secret -n inventario-itu inventario-backend-secret -o yaml | grep JWT_SECRET
```

Si el valor decodificado es `dev-secret-change-me`:

1. Generar un secreto fuerte: `openssl rand -base64 32`
2. Actualizar el Secret de K8s: `kubectl create secret generic ... --from-literal=JWT_SECRET=...`
3. Reiniciar el backend: `kubectl rollout restart deployment/inventario-backend -n inventario-itu`

### Rate limiting en login

**Archivo:** `backend/src/app.ts`
**Estimado:** 1 h
**Severidad:** Critica

No hay limite de intentos en `/api/auth/login`. Un atacante puede tirar miles de
contrasenas contra el AD real en minutos. Sin rate limiting, la fuerza bruta es
trivial.

```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit'

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.mockMode ? 0 : 10,
  message: { error: 'Demasiados intentos. Espera 15 minutos.' },
})
app.use('/api/auth/login', loginLimiter)
```

Nota: en modo mock (`MOCK_MODE=true`) el rate limit se desactiva (`max: 0`) para
no estorbar el desarrollo local.

---

## Prioridad 2 — Si sobra tiempo

### TLS en conexion LDAP

**Archivo:** `backend/src/db/ldapClient.ts`
**Estimado:** 2 h (depende del AD)
**Severidad:** Alta

Hoy el Secret de produccion usa `ldap://` — credenciales viajan en texto plano.
El codigo ya soporta `ldaps://` por defecto. Si el AD tiene el puerto 636 abierto,
cambiar el Secret:

```yaml
LDAP_URL: "ldaps://192.168.1.10:636"
```

---

## Lo que ya esta bien (no tocar)

- [x] Helmet (security headers): activo en app.ts:27
- [x] JWT aud/iss: configurado al firmar y verificar
- [x] Queries parametrizadas (SQL): sql.input() — sin riesgo de inyeccion
- [x] Inyeccion LDAP: escapado en ldapClient.ts
- [x] CORS: restringido por variable de entorno
- [x] RBAC en PUT hardware: corregido
- [x] Network policies K8s: default-deny + reglas explicitas
- [x] Separacion mock/real: funciona sin cambios
- [x] Logging de intentos fallidos: implementado
- [x] Secretos en .gitignore: .env ignorado
- [x] Seed data idempotente: MongoDB Job salta si ya hay datos

---

## Plan de ejecucion

- [ ] Verificar JWT secret en produccion (5 min) — `secret.yaml`
- [ ] Rate limiting en login (1 h) — `app.ts`, `package.json`
- [ ] TLS en conexion LDAP (2 h, si sobra tiempo) — `secret.yaml`

Tiempo total estimado del core: 1 h.

---

*Revision actualizada al 21/06/2026. Items resueltos omitidos —
ver `docs/seguridad.md` y `docs/TASKS.md` para el historial completo.*
