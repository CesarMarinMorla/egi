# Issues detectados — Deploy con GitHub Actions

> Proyecto: Inventario ITU
> Pipeline: `.github/workflows/deploy.yml`
> Estado: CI pasa OK, deploy requiere self-hosted runner

---

## Criticos (bloquean o rompen el deploy)

- [ ] #1 **Backend startup fragil**: no reconecta si SQL/Mongo/AD no estan listos (`backend/src/server.ts:24-37`). Al arrancar con `MOCK_MODE=false`, intenta conectar a SQL Server, MongoDB y LDAP. Si cualquiera falla, lanza excepcion y el pod crashloopeara para siempre. No hay logica de reintento ni backoff.
- [ ] #2 **Race condition: backend vs MongoDB** (`deploy.yml:65-69` vs `deploy.yml:71-72`). Se aplica MongoDB y backend por separado. `kubectl rollout status` espera que el Deployment de MongoDB este "ready" (pod running), no que `mongod` acepte conexiones. Backend puede arrancar antes y fallar.
- [ ] #3 **Seed de SQL Server condicional a GitHub Secret** (`deploy.yml:128`). `if: ${{ secrets.SQL_SERVER != '' }}` — si el secret no esta configurado en el repo, el bootstrap de SQL Server se salta silenciosamente. La tabla `machines` nunca se crea y el backend queda corriendo sin datos.
- [ ] #4 **`hostname -I` fragil en `setup-host-networking.sh`** (`k8s/setup-host-networking.sh:30`). `hostname -I` devuelve todas las IPs del host. `awk '{print $1}'` agarra la primera, que puede ser la IP de Docker bridge (`172.x.x.x`) en vez de la LAN (`192.168.1.x`). El iptables DNAT apuntaria a la IP incorrecta.

---

## Seguridad

- [ ] #5 **Credenciales en texto plano en el repo** (`k8s/backend/secret.yaml`). SQL password (`Mysql123`) y LDAP bind password (`EgiLdap2026!`) estan hardcodeados en un archivo YAML commiteado. Si el repo es publico o un colaborador se va, las credenciales quedan expuestas.

---

## Mejoras de calidad

- [ ] #6 **CI no ejecuta tests** (`.github/workflows/ci.yml:35`). Hay tests en `backend/src/__tests__/`, el pipeline corre `typecheck` + `build` pero nunca `npm test`. Las regresiones en logica de negocio no se detectan en CI.
- [ ] #7 **Seed job usa `mongo` CLI (deprecado)** (`k8s/mongo/seed-job.yaml:31,38,41,45`). Usa el shell `mongo` que fue deprecado en MongoDB 5+ y eliminado en 6+. La imagen `mongo:4.4` lo incluye, pero al migrar a MongoDB 7 el seed job se rompe (hay que migrar a `mongosh`).
- [ ] #8 **Sin tests de integracion en el pipeline**. El smoke test solo verifica `/health` del backend. No prueba la conexion real a SQL Server + MongoDB + AD, ni verifica que el frontend sirva contenido.
- [ ] #9 **Sin schema validation en MongoDB** (`database/mongo/`). MongoDB no tiene `$jsonSchema` configurado. Un sysadmin con acceso a mongosh puede insertar documentos con estructura incoherente (campos faltantes, tipos incorrectos) y la BD los acepta. El proyecto solo valida en frontend (Zod) y backend (TypeScript), no a nivel de BD.

---

## Validado — funciona OK

- [x] Build de imagenes Docker: `docker/build-push-action` con GHCR
- [x] Push a GHCR: usa `GITHUB_TOKEN`
- [x] Namespace + MongoDB + Backend + Frontend + Network Policies: `kubectl apply -f` idempotente
- [x] Container names en `set image`: `backend` y `web` coinciden con los Deployment specs
- [x] Job seed MongoDB: idempotente, solo inserta si la coleccion esta vacia
- [x] iptables DNAT + FORWARD + DOCKER-USER: reglas correctas, con `ensure_rule` para evitar duplicados
- [x] Nginx reverse proxy `/api/ -> backend:3001`: DNS resuelve `inventario-backend` via Service ClusterIP

---

## Resumen

| Prioridad | Accion |
|-----------|--------|
| Hacer ahora | Agregar reintento/initContainer para DBs (issue 1, 2) |
| Hacer ahora | Configurar el secret `SQL_SERVER` en GitHub (issue 3) |
| Esta semana | Parametrizar `HOST_LAN_IP` en `setup-host-networking.sh` (issue 4) |
| Esta semana | Mover credenciales a GitHub Secrets + `envFrom`/`external-secrets` (issue 5) |
| Mejorar | Agregar `npm test` al CI (issue 6), migrar a `mongosh` (issue 7), agregar smoke test al frontend (issue 8), agregar `$jsonSchema` validator a MongoDB (issue 9) |
