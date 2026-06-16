# Pruebas de conexión — Producción

Ejecutar los siguientes tests desde la VM Linux (`192.168.1.50`) para verificar conectividad.

## 1. Conectividad básica del host

```bash
# Gateway
ping -c 3 192.168.1.254

# Salida a internet
ping -c 3 8.8.8.8
nslookup google.com

# IP propia
ip addr show | grep 'inet '
```

## 2. Conectividad con otras VMs

```bash
# Active Directory
ping -c 3 192.168.1.10
nc -zv 192.168.1.10 389
nc -zv 192.168.1.10 636

# SQL Server
ping -c 3 192.168.1.20
nc -zv 192.168.1.20 1433
```

| Prueba | Resultado |
|---|---|
| `ping 192.168.1.10` (AD) | ✅ Funciona |
| `nc 192.168.1.10 389` (LDAP) | ✅ Funciona |
| `nc 192.168.1.10 636` (LDAPS) | ✅ Funciona |
| `ping 192.168.1.20` (SQL) | ✅ Funciona |
| `nc 192.168.1.20 1433` (SQL) | ✅ Funciona |

## 3. Conectividad con pfSense

```bash
ping -c 3 192.168.1.254
```

## 4. Estado del cluster

```bash
# Minikube
minikube status
minikube ip

# Pods
kubectl get pods -n inventario-itu -o wide

# Servicios
kubectl get svc -n inventario-itu
```

## 5. Acceso al frontend

```bash
# Desde el host local
curl -v http://localhost:30080
curl -v http://192.168.1.50:30080

# Desde el cluster (NodePort directo)
curl -v http://$(minikube ip):30080
```

## 6. Health check del backend

```bash
kubectl port-forward -n inventario-itu svc/inventario-backend 3001:3001 &
sleep 1
curl -v http://localhost:3001/health
kill %1 2>/dev/null
```

## 7. Verificar reglas iptables

```bash
sudo bash k8s/setup-host-networking.sh --status
```

## 8. Prueba desde otra máquina en la LAN

```bash
curl -v http://192.168.1.50:30080
```

## 9. Verificar servicios systemd (persistencia post-reinicio)

```bash
sudo systemctl status iptables-restore minikube docker
```

| Servicio | Estado esperado |
|---|---|
| `iptables-restore.service` | `enabled`, `inactive (dead)` (se ejecuta una vez al arrancar) |
| `minikube.service` | `enabled`, `active (exited)` si ya arrancó |
| `docker.service` | `enabled`, `active (running)` |

| Origen | Acceso al frontend | Fecha |
|---|---|---|
| AD (`192.168.1.10`) | ✅ | 10/06/2026 |
| Lubuntu (`192.168.1.x`) | ✅ | 10/06/2026 |
| Host Windows | ❌ Pendiente (pfSense) | — |
