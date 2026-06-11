# pfSense — Reglas NAT y Firewall

## Regla NAT (Port Forward)

**Firewall → NAT → Port Forward → Add**

| Campo | Valor |
|---|---|
| Interface | `WAN` |
| Address Family | `IPv4` |
| Protocol | `TCP` |
| Source | `any` |
| Destination | `WAN address` |
| Destination port range | `HTTP (80)` |
| Redirect target IP | `192.168.1.50` |
| Redirect target port | `80` |
| Description | `Frontend Inventario ITU` |

> **Importante:** Redirect target port debe ser `80` (no `30080`). La regla de filtro automática que crea pfSense matchea el puerto destino original (pre-NAT). Si se usa `30080`, el filtro busca puerto `80` pero el paquete post-NAT tiene puerto `30080` → no coincide → bloqueo por `Default deny`.

## Regla de Firewall (WAN)

Se genera automáticamente al guardar la NAT. Verificar en **Firewall → Rules → WAN**.

| Campo | Valor |
|---|---|
| Action | `Pass` |
| Interface | `WAN` |
| Protocol | `TCP` |
| Source | `any` |
| Destination | `192.168.1.50` |
| Destination port | `HTTP (80)` |

## Flujo completo

```
Host (172.22.75.116)
    │ GET http://172.22.75.52
    ▼
pfSense WAN (172.22.75.52:80)
    │ rdr (NAT): → 192.168.1.50:80
    │ pass in quick (puerto 80 coincide)
    ▼
VM Linux (192.168.1.50:80)
    │ iptables DNAT: → 192.168.49.2:30080
    ▼
Minikube NodePort (192.168.49.2:30080) → Pod nginx :80
```

## Solución de problemas

| Síntoma | Causa | Solución |
|---|---|---|
| `Default deny` en WAN bloquea | Redirect target port `30080` en vez de `80` | Cambiar a `80` en Firewall → NAT → Port Forward |
| Ping funciona, TCP no | Regla de filtro no matchea puerto post-NAT | Verificar puerto destino en regla WAN |

## Notas

- La IP WAN puede cambiar entre sesiones (DHCP del aula) — verificar en la CLI de pfSense antes de cada sesión.
- SQL Server (`:1433`) y AD (`:389`) **no tienen port forward** — solo accesibles desde la red interna `192.168.1.0/24`.
