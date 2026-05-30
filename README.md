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

## Desarrollo local

```bash
# Backend (TypeScript con hot-reload)
cd backend
npm install
npm run dev
# → http://localhost:3001

# Frontend (Vite con proxy al backend)
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

Por defecto el backend corre en **mock mode** con datos de prueba. Para deshabilitarlo:

```bash
MOCK_MODE=false npm run dev
```

## Despliegue

Ver `k8s/` para manifiestos de Kubernetes y `k8s/deploy-local.sh` para deploy local en Minikube.
