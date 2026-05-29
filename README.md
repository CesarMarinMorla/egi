# README

Sistema centralizado de gestión de activos IT para los laboratorios de informática de la universidad.

## Stack

- **Frontend**: React + Nginx
- **Backend**: Node.js + Express
- **DB documental**: MongoDB 7
- **DB relacional**: SQL Server (VM dedicada)
- **Autenticación**: Active Directory (VM dedicada)
- **Orquestación**: Kubernetes (Minikube)
- **CI/CD**: GitHub Actions
- **Firewall**: pfSense

## Estructura

```
inventario-itu/
├── .github/workflows/      # Pipeline CI/CD
├── frontend/               # React + Dockerfile
├── backend/                # Node.js/Express + Dockerfile
├── k8s/                    # Manifiestos de Kubernetes
├── database/               # Scripts SQL y documentos MongoDB
└── docs/                   # Diagramas y presentación
```
