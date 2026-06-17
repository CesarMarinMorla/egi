# Topología de red — Producción

## Subredes

| Red | Gateway | Interfaz | Descripción |
|---|---|---|---|
| `192.168.1.0/24` | `192.168.1.254` | LAN pfSense | Red interna de producción |
| `192.168.49.0/24` | `192.168.49.1` | `br-<docker>` | Bridge Docker de Minikube |
| `192.168.122.0/24` | `192.168.122.1` | `virbr0` | NAT de libvirt (si aplica) |

## Hosts

| Host | IP | Rol |
|---|---|---|
| pfSense WAN | `<WAN_IP>` | Gateway externo (WiFi del aula) |
| pfSense LAN | `192.168.1.254` | Gateway interno |
| Ubuntu Server (VM Linux) | `192.168.1.50` | Minikube + GitHub Runner |
| SQL Server | `ITUSRV002 (192.168.1.20)` | Base de datos relacional |
| Active Directory | `192.168.1.10` | Autenticación LDAP |
| Minikube (interno) | `192.168.49.2` | Clúster K8s (no accesible directo desde LAN) |

## Servicios expuestos

| Servicio | Puerto interno | NodePort | Acceso desde LAN |
|---|---|---|---|
| Frontend (nginx) | 80 | `30080` | `192.168.1.50:30080` |
| Backend (express) | 3001 | — | Solo cluster (ClusterIP) |
| MongoDB | 27017 | — | Solo cluster (ClusterIP) |
