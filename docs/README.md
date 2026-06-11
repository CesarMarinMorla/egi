# Documentación del proyecto

Estructura de la documentación del sistema de inventario ITU.

| Directorio / Archivo | Descripción |
|---|---|
| `docs/arquitectura/topologia.md` | Topología de red |
| `docs/arquitectura/diagrama-bd-relacional.md` | Diagrama entidad-relación (SQL Server + MongoDB) |
| `docs/arquitectura/database-engines.md` | Diferencias entre motores de DB y uso del driver `mssql` |
| `docs/arquitectura/validacion-frontend.md` | Validación con Zod en el frontend (decisiones de diseño) |
| `docs/despliegue/` | Guías de deployment en producción |
| `docs/despliegue/scripts/` | Configuración de VMs Windows (SQL Server, AD) |
| `docs/testing/` | Entornos de desarrollo local (mock, Docker, Minikube) |
| `docs/incidentes/` | Reportes post-mortem |
| `docs/seguridad.md` | Análisis de seguridad y hoja de ruta |
| `docs/consigna.md` | Consigna original del proyecto (EGI) |
| `docs/TASKS.md` | Seguimiento de tareas del proyecto |

**Enlaces:** [Topología](arquitectura/topologia.md) · [BD Relacional](arquitectura/diagrama-bd-relacional.md) · [Producción](despliegue/produccion.md) · [VM Linux](despliegue/vm-linux.md) · [pfSense NAT](despliegue/pfsense-nat.md) · [Seguridad](seguridad.md) · [TASKS](TASKS.md)
