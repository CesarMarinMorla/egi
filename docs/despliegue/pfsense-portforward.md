# pfSense — Port Forwards

Configuración en **Firewall → NAT → Port Forward**.

## Reglas requeridas

| Descripción | Interface | Protocolo | Puerto WAN | Destino interno | Puerto destino |
|---|---|---|---|---|---|
| Frontend (acceso profesores) | WAN | TCP | `80` | `192.168.1.50` | `30080` |

## Configuración paso a paso (webConfigurator)

1. Ir a **Firewall → NAT → Port Forward**
2. Click en **Add**
3. Completar los campos:

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

4. **Save** → **Apply Changes**

## Verificación

Desde cualquier dispositivo en la red del aula:

```bash
curl -I http://<WAN_IP>
# HTTP/1.1 200 OK
```

O abrir `http://<WAN_IP>` en el browser — debe cargar el frontend React.

La IP WAN actual se ve en la pantalla de inicio de la CLI de pfSense:
```
WAN (wan) -> em0 -> v4: <WAN_IP>/23
```

## Notas

- La IP WAN puede cambiar entre sesiones (DHCP del aula) — siempre verificar en la CLI antes del examen.
- SQL Server (`:1433`) y AD (`:389`) **no tienen port forward** — solo son accesibles desde la red interna `192.168.1.0/24`.
- Si el enunciado requiere HTTPS, cambiar el puerto WAN a `443` y configurar un certificado en pfSense (HAProxy o reverse proxy integrado).
