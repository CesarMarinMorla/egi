# Reporte: Acceso desde la LAN al frontend en Minikube

**Host:** `192.168.1.35` — Minikube (driver docker)
**Otra PC:** Misma red WiFi `192.168.1.0/24`

---

## Estado actual

- 3 pods corriendo en `inventario-itu` (backend, db, frontend)
- Servicio `inventario-web` tipo NodePort → puerto `30080`
- `curl http://192.168.1.35:30080` funciona desde el host
- `curl http://192.168.1.35:30080` **no funciona** desde la otra PC (timeout)
- `ping 192.168.1.35` funciona desde la otra PC (0% pérdida)
- `nc 192.168.1.35 22` tampoco funciona (timeout)

## Reglas agregadas

- `iptables -t nat -A PREROUTING -p tcp --dport 30080 -j DNAT --to-destination $(minikube ip):30080`
- `iptables -t nat -A OUTPUT -p tcp --dport 30080 -j DNAT --to-destination $(minikube ip):30080`
- `iptables -A FORWARD -p tcp -d $(minikube ip) --dport 30080 -j ACCEPT`

## Causa probable

**AP Isolation (aislamiento de clientes WiFi)** en el router. Bloquea tráfico TCP/UDP entre dispositivos conectados por WiFi. Solo ICMP pasa.

## Solución

1. Desactivar AP Isolation / Client Isolation en el router (`192.168.1.1`)
2. O conectar el host por Ethernet (el aislamiento no afecta Ethernet↔WiFi)

## Script modificado

- `fix(k8s): usar sudo para iptables en deploy-local.sh` (commit `0d867ac`)
- Cambio: detecta si corre como root o usa `sudo` automáticamente para iptables
