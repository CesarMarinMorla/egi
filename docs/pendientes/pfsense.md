# Setup — pfSense (port forward)

Ver también: `docs/pfsense-portforward.md`

## Port forward: Frontend

**Firewall → NAT → Port Forward → Add**

| Campo | Valor |
|---|---|
| Interface | `WAN` |
| Address Family | `IPv4` |
| Protocol | `TCP` |
| Destination | `WAN address` |
| Destination port range | `HTTP (80)` |
| Redirect target IP | `192.168.1.50` |
| Redirect target port | `30080` |
| Description | `Frontend Inventario ITU` |

**Save → Apply Changes**

## Verificar IP WAN actual

La IP WAN se muestra en la pantalla de inicio de la CLI de pfSense:

```
WAN (wan) -> em0 -> v4: <WAN_IP>/23
```

Esa es la URL que se le da al profesor: `http://<WAN_IP>`

## Verificar que el port forward funciona

Desde un dispositivo en la red del aula (fuera de la red interna):

```bash
curl -I http://<WAN_IP>
# HTTP/1.1 200 OK
```
