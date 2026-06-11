# Despliegue — Índice

## Producción

| Guía | Descripción |
|---|---|
| [produccion.md](produccion.md) | Arquitectura general, requisitos, flujo CI/CD |
| [vm-linux.md](vm-linux.md) | Setup completo del nodo Ubuntu Server (Minikube, iptables, runner) |
| [pfsense-nat.md](pfsense-nat.md) | Reglas NAT y firewall en pfSense |
| [pruebas-conexion.md](pruebas-conexion.md) | Tests de conectividad desde la VM Linux |
| [scripts/sql-server.md](scripts/sql-server.md) | Configuración de SQL Server VM |
| [scripts/active-directory.md](scripts/active-directory.md) | Configuración de AD VM |

## Testing local

| Guía | Descripción |
|---|---|
| [testing/local-dev.md](../testing/local-dev.md) | Modo mock con `npm run dev` (sin Docker) |
| [testing/docker-compose.md](../testing/docker-compose.md) | SQL Server + MongoDB via Docker Compose |
| [testing/minikube-local.md](../testing/minikube-local.md) | Minikube local con mock mode |
