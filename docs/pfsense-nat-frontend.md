# pfSense — Reglas NAT y Firewall para el Frontend

## Regla NAT (Port Forward)

**Firewall → NAT → Port Forward → Edit (o Add)**

| Campo | Valor |
|---|---|
| Interface | `WAN` |
| Address Family | `IPv4` |
| Protocol | `TCP` |
| Source | `any` |
| Destination | `WAN address` |
| Destination port | `HTTP (80)` |
| Redirect target IP | `192.168.1.50` |
| Redirect target port | `80` |
| Description | `Frontend Inventario ITU` |

> **Importante:** Redirect target port debe ser `80` (no `30080`). La regla de filtro automática que crea pfSense matchea el puerto destino original (pre-NAT). Si se usa `30080`, el filtro busca `puerto 80` pero el paquete post-NAT tiene `puerto 30080` → no coincide → bloqueo por `Default deny`.

## Regla de Firewall (WAN)

Se genera automáticamente al guardar la NAT. Se puede verificar en **Firewall → Rules → WAN**.

| Campo | Valor |
|---|---|
| Action | `Pass` |
| Interface | `WAN` |
| Protocol | `TCP` |
| Source | `any` |
| Destination | `192.168.1.50` |
| Destination port | `HTTP (80)` |
| Description | `Frontend Inventario ITU` |

## Reglas iptables en la VM Linux (`192.168.1.50`)

El host tiene reglas DNAT para redirigir el tráfico de la LAN al NodePort de Minikube. Se gestionan con el script `k8s/setup-host-networking.sh`.

| Cadena | Tabla | Regla |
|---|---|---|
| PREROUTING | nat | `DNAT --dport 80 → 192.168.49.2:30080` |
| PREROUTING | nat | `DNAT --dport 30080 → 192.168.49.2:30080` |
| OUTPUT | nat | `DNAT --dport 80 → 192.168.49.2:30080` |
| OUTPUT | nat | `DNAT --dport 30080 → 192.168.49.2:30080` |
| FORWARD | filter | `ACCEPT -d 192.168.49.2 --dport 30080` |
| DOCKER-USER | filter | `ACCEPT -o <docker_bridge> --dport 30080` |

## NAT Reflection (acceso WAN desde la misma red)

Si el cliente está en la misma subred que la WAN de pfSense (ej. PC host en `172.22.74.0/23`), se requiere NAT reflection:

**System → Advanced → Firewall & NAT → Network Address Translation**

| Opción | Valor |
|---|---|
| NAT Reflection mode for port forwards | `Pure NAT` |
| Enable automatic outbound NAT for Reflection | ✅ |

## Flujo completo

```
Host (172.22.75.116)
    │ GET http://172.22.75.52
    │
    ▼
pfSense WAN (172.22.75.52:80)
    │ rdr (NAT): → 192.168.1.50:80
    │ pass in quick (puerto 80 coincide)
    │ NAT reflection: source NAT para mantener la conexión
    │
    ▼
VM Linux (192.168.1.50:80)
    │ iptables DNAT: → 192.168.49.2:30080
    │
    ▼
Minikube NodePort (192.168.49.2:30080)
    │
    ▼
Pod inventario-web (nginx :80)
```

## Solución de problemas

| Síntoma | Causa | Solución |
|---|---|---|
| `Default deny` en WAN bloquea | Redirect target port `30080` en vez de `80` | Cambiar a `80` en Firewall → NAT → Port Forward |
| Ping funciona, TCP no | Regla de filtro no matchea puerto post-NAT | Verificar puerto destino en regla WAN |
| Timeout desde host local | NAT reflection deshabilitado | System → Advanced → Firewall & NAT → `Pure NAT` |
