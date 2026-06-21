# Despliegue — Producción (VirtualBox + pfSense)

Arquitectura completa con Minikube, SQL Server, Active Directory y pfSense, todos corriendo como VMs en VirtualBox sobre una PC Windows.

## Arquitectura

```mermaid
flowchart TB
 subgraph External[" "]
 User(["Profesor / Usuario"])
 GH(["GitHub Actions\nCI/CD"])
 end

 subgraph FW["pfSense Firewall (WAN: IP del WiFi)"]
 direction TB
 TLS["Port forward:80 → VM Linux:80"]
 NAT["NAT / ACL — solo red interna"]
 WAF["WAF / rate limiting"]
 end

 subgraph VBox["PC Windows — VirtualBox (red interna 192.168.56.0/24)"]
 direction TB

 subgraph Linux["VM Linux (192.168.1.50)"]
 Runner["GitHub Actions Runner"]
 subgraph Cluster["Minikube — inventario-itu"]
 WebSvc("Service NodePort 80:30080")
 BeSvc("Service ClusterIP:3001")
 MongoSvc("Service ClusterIP:27017")
 NP["Network Policies\ndeny-all + reglas explícitas"]
 end
 end

 SQL[("VM Windows Server\nSQL Server\nITUSRV002 (192.168.1.20:1433)")]
 AD[("VM Windows Server\nActive Directory\n192.168.1.10:389")]
 end

 User -->|":80 HTTP"| TLS
 GH -->|"push a main → job"| Runner
 TLS -->|":30080"| WebSvc
 WebSvc --> BeSvc
 BeSvc --> MongoSvc
 BeSvc -.->|"egress:1433"| SQL
 BeSvc -.->|"egress:389"| AD
```

## Requisitos

| Componente | Mínimo recomendado |
|---|---|
| PC Windows (host) | 16 GB RAM |
| VM pfSense | 256 MB RAM, 1 CPU |
| VM SQL Server | 3–4 GB RAM, 2 CPUs |
| VM AD | 2 GB RAM, 1 CPU |
| VM Linux (Minikube) | 3 GB RAM, 2 CPUs |

## Red VirtualBox

Todas las VMs están en la LAN de pfSense (`192.168.1.0/24`). pfSense tiene un adaptador WAN con IP en la red del aula.

| VM | IP | Rol |
|---|---|---|
| pfSense WAN | `<WAN_IP>` | Punto de entrada externo (red del aula, asignada por DHCP) |
| pfSense LAN | `192.168.1.254` | Gateway de la red interna |
| SQL Server | `ITUSRV002 (192.168.1.20)` | Base de datos relacional |
| Active Directory | `192.168.1.10` | Autenticación LDAP |
| Linux (Minikube) | `192.168.1.50` | Cluster K8s + GitHub Runner |

## Guías detalladas

| Tema | Documento |
|---|---|
| pfSense NAT y firewall | [pfsense-nat.md](pfsense-nat.md) |
| Topología de red | [arquitectura/topologia.md](../arquitectura/topologia.md) |

## Persistencia

### Datos

| Dato | Backend | Notas |
|---|---|---|
| Máquinas | SQL Server (`ITUSRV002 / 192.168.1.20`) | `MOCK_MODE=false` |
| Hardware | MongoDB (`inventario-db` ClusterIP) | Pod dentro del cluster |
| Usuarios / Auth | Active Directory (`192.168.1.10`) | LDAP sobre red interna |

### Servicios del host

Los servicios de la VM Linux arrancan automáticamente al iniciar:

| Servicio | Rol | Depende de |
|---|---|---|
| `docker.service` | Motor de contenedores | — |
| `iptables-restore.service` | Restaura reglas DNAT desde `/etc/iptables/rules.v4` | — |
| `minikube.service` | Inicia el clúster Minikube con Calico | Docker + iptables-restore |

## Flujo CI/CD completo

```
git push main
 │
 ├── ci.yml (runners GitHub)
 │ lint + typecheck + build
 │
 └── deploy.yml (runner self-hosted en VM Linux)
 bootstrap SQL → build imágenes → push GHCR
 → kubectl apply → rollout → iptables (safety net) → smoke test
```

## Estado actual del despliegue

| Componente | Estado |
|---|---|
| **Frontend** | Accesible desde LAN y WAN vía pfSense |
| **Backend** | `MOCK_MODE=false` |
| **SQL Server** | `192.168.1.20`, instancia `ITULAB`, DB `inventario_itu` |
| **Active Directory** | `192.168.1.10` — `OU=EGI` con grupos por laboratorio (`GRP_Editor_Lab101`, `GRP_Operator_Lab102`, etc.) |
| **MongoDB** | Auth activada — usuario `egi_user` |
| **Integración AD → SQL Server** | Vía script `ad-sqlserver-logins.sql` |
| **Network Policies** | Default-deny |
| **Última verificación** | 21/06/2026 |

## Credenciales de servicio

| Servicio | Usuario / Bind | Contraseña | Notas |
|---|---|---|---|
| SQL Server | `sa` | `Mysql123` | Instancia `ITULAB` |
| MongoDB | `egi_user` | `EgiMongo2026!` | `authSource=admin` |
| LDAP (bind) | `svc_egi_ldap` | `EgiLdap2026!` | — |
| pfSense | `admin` | `Itu12345!` | — |

### Usuarios de prueba (Active Directory)

| Usuario | Contraseña |
|---|---|
| `test_sysadmin` | `Test2026!` |
| `test_manager` | `Test2026!` |
| `test_editor` | `Test2026!` |
| `test_operator` | `Test2026!` |
| `test_readonly` | `Test2026!` |

## Detener

```bash
minikube stop # pausa el cluster, conserva datos
minikube delete # elimina todo
```
