# Inventario IT — Universidad

Sistema centralizado de gestión de activos IT para los laboratorios de informática de la universidad.

## Stack

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 19 + TypeScript + Vite + React Router |
| **Backend** | Node.js + Express 5 + TypeScript |
| **DB documental** | MongoDB 7 |
| **DB relacional** | SQL Server (VM dedicada) |
| **Autenticación** | Active Directory (VM dedicada) |
| **Container** | Docker + Docker Compose |
| **Orquestación** | Kubernetes (Minikube) |
| **CI/CD** | GitHub Actions |
| **Firewall** | pfSense |

## Arquitectura del backend

```
src/
├── app.ts                  # Setup Express, middlewares, monta rutas
├── server.ts               # Entry point — levanta el servidor
├── config.ts               # Variables de entorno tipadas
├── types/                  # DTOs e interfaces compartidas
│
├── routes/                 # Definición de endpoints + middlewares
├── controllers/            # Manejo de request/response
├── services/               # Lógica de negocio
│
├── repositories/           # Capa de acceso a datos
│   ├── interfaces/         #   Contratos (como @Repository en Spring)
│   ├── sql/                #   Implementación SQL Server
│   ├── mongo/              #   Implementación MongoDB
│   └── ldap/               #   Implementación LDAP
│
├── mock/repositories/      # Implementaciones mock (usadas por defecto)
├── db/                     # Conexiones a bases de datos reales
├── middleware/              # auth JWT + RBAC
└── lib/                    # Permisos + errores custom

app.ts → server.ts → routes → controllers → services → repositories
```

El backend sigue una arquitectura en capas (similar a Spring Boot) con **dependency injection manual**. Cada capa solo conoce a la inmediata inferior. Los repositorios se definen por interfaz para poder switchear entre mock y real sin tocar servicios.

## Estructura del proyecto

```
inventario-itu/
├── .github/workflows/        # Pipeline CI/CD
├── frontend/
│   ├── src/
│   │   ├── components/       # Componentes React
│   │   ├── pages/            # Páginas/rutas
│   │   ├── context/          # AuthContext
│   │   ├── hooks/            # Custom hooks (usePermissions)
│   │   ├── services/         # API client + mocks frontend
│   │   └── types/            # Tipos compartidos
│   ├── Dockerfile
│   └── nginx.conf
├── backend/
│   ├── src/                  # (ver arquitectura arriba)
│   ├── Dockerfile
│   └── tsconfig.json
├── k8s/                      # Manifiestos de Kubernetes
│   ├── backend/
│   ├── frontend/
│   ├── mongo/
│   ├── namespace/
│   └── network-policies/
├── database/
│   ├── sql/                  # Scripts SQL Server
│   └── mongo/                # Documentos MongoDB
└── docs/
```

## Prerequisitos

- Node.js 20+
- Docker + Colima (o Docker Desktop)
- Minikube (solo para modo K8s)

## Desarrollo local

Hay **3 formas** de correr el proyecto:

---

### 1. Modo mock (cero dependencias)

Backend y frontend funcionan completamente con datos mock en memoria. No requiere Docker ni bases de datos.

```bash
# Terminal 1 — backend
cd backend
npm install
npm run dev
# → http://localhost:3001 (mock mode)

# Terminal 2 — frontend
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

### 2. Modo real con Docker (SQL Server + MongoDB)

Requiere las bases de datos corriendo via Docker Compose:

```bash
# 1. Levantar SQL Server + MongoDB
docker compose up -d

# 2. (Primera vez) Bootstrap de tablas SQL Server
cd backend
node scripts/bootstrap.mjs

# 3. Backend real
cd backend
MOCK_MODE=false npm run dev
# → http://localhost:3001 (modo real)

# 4. Frontend apuntando al backend real
cd frontend
VITE_USE_MOCK=false npm run dev
# → http://localhost:5173
```

Credenciales por defecto (definidas en `backend/.env` y en `docker-compose.yml`):

| Variable | Valor |
|----------|-------|
| SQL Server | `localhost:1433` |
| SQL User | `sa` |
| SQL Password | `Mysql123` |
| MongoDB | `mongodb://localhost:27017` |

Para detener las bases de datos:

```bash
docker compose down
```

---

### 3. Modo Kubernetes (Minikube) — Producción

El deploy en Minikube corre con `MOCK_MODE=false` conectándose a SQL Server real (`192.168.1.20:1433`), MongoDB in-cluster y Active Directory real (`192.168.1.10:389`).

```bash
# Iniciar Minikube (una sola vez)
minikube start --cni=calico

# Build imágenes locales + deploy
bash k8s/deploy-local.sh

# Obtener URL del frontend
minikube service inventario-web -n inventario-itu --url
```

Accesible desde la LAN en `http://192.168.1.50:30080`.

## Verificación

### Health check del backend

**Modo dev (mock):**
```bash
curl http://localhost:3001/health
```
→ `{"status":"ok","mockMode":true}`

**Modo producción (Minikube):**
```bash
kubectl port-forward -n inventario-itu svc/inventario-backend 30010:3001 &
sleep 1
curl http://localhost:30010/health
kill %1 2>/dev/null
```
→ `{"status":"ok","mockMode":false}` ✅ Verificado

### Login de prueba (mock — dev local)

```bash
curl -s -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"sysadmin","password":"x"}' | jq .
```

### Endpoints de datos en Minikube (requiere token AD real)

```bash
# Port-forward al backend
kubectl port-forward -n inventario-itu svc/inventario-backend 30010:3001 &
sleep 1

TOKEN=$(curl -s -X POST http://localhost:30010/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"usuario-ad-real","password":"password-ad-real"}' | jq -r '.token')

# Máquinas (desde SQL Server real)
curl -s http://localhost:30010/api/machines -H "Authorization: Bearer $TOKEN" | jq .

# Hardware (desde MongoDB in-cluster)
curl -s http://localhost:30010/api/machines/1/hardware -H "Authorization: Bearer $TOKEN" | jq .

kill %1 2>/dev/null
```

## Tests

```bash
cd backend
npm test              # Una vez
npm run test:watch    # Modo watch
```

## Despliegue

El sistema está actualmente desplegado en Minikube en `192.168.1.50:30080` con modo real (`MOCK_MODE=false`).

Ver `k8s/` para manifiestos de Kubernetes y `k8s/deploy-local.sh` para deploy local en Minikube.

El pipeline de CI/CD (`.github/workflows/`) automatiza:
- **CI**: lint + typecheck + build en cada PR a `main`/`develop`
- **CD**: build de imágenes → push a GHCR → `kubectl apply` → smoke test en push a `main`
