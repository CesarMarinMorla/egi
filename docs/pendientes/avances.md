# Avances

## Sesión 2 — 10/06/2026 (persistencia post-reinicio)

### Resumen

Se aseguró que toda la configuración de la VM Linux sobreviva a un reinicio: iptables, Minikube, red estática y DNS.

### Cambios realizados

- Creado `iptables-restore.service`: guarda reglas en `/etc/iptables/rules.v4` y las restaura al arrancar
- Creado `minikube.service`: inicia el clúster automáticamente tras Docker e iptables (con `Environment=HOME=/home/cesar`)
- Verificado que `lan-internal` (NetworkManager) tiene `autoconnect: sí` con IP estática y DNS 8.8.8.8
- Docker ya estaba con `systemctl enable docker`

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `docs/pfsense-nat-frontend.md` | Sección "Servicios systemd configurados" agregada; nota de persistencia en iptables |
| `k8s/setup-host-networking.sh` | Comentario actualizado indicando persistencia via systemd |
| `docs/pendientes/vm-linux.md` | Pasos 7 y 11 actualizados con los servicios systemd |

---

## Sesión 1 — 10/06/2026 (red y acceso al frontend)

## Problemas resueltos

### 1. Falta de DNAT para acceso desde la LAN

**Síntoma:** el frontend (NodePort `:30080`) solo era accesible desde el host local en `localhost:30080` o `$(minikube ip):30080`. No se podía acceder desde otras máquinas en la red.

**Causa:** Minikube con driver `docker` expone los NodePorts en una red interna aislada (`192.168.49.0/24`). Sin reglas iptables DNAT, el tráfico dirigido a la IP del host (`192.168.1.50:30080`) nunca llega al cluster.

**Solución:** reglas DNAT en PREROUTING y OUTPUT, más regla FORWARD para permitir el reenvío.

### 2. Docker filtra tráfico externo hacia su bridge

**Síntoma:** incluso con las reglas DNAT activas, el tráfico proveniente de VMs (virt-manager/libvirt) era descartado silenciosamente (timeout). Ping y SSH funcionaban, pero el puerto 30080 no.

**Causa:** Docker inyecta una cadena `DOCKER` en la tabla `filter` de iptables/nftables con una regla de descarte genérico:

```
iifname != "br-<bridge>" oifname "br-<bridge>" drop
```

Todo tráfico que **no** entre por el bridge de Docker pero salga por él es descartado.

**Solución:** regla en `DOCKER-USER` (cadena que Docker respeta y no sobrescribe) para aceptar el puerto 30080 hacia el bridge de Docker.

## Archivos creados/modificados

| Archivo | Cambio |
|---|---|
| `k8s/setup-host-networking.sh` | **Nuevo.** Script iptables idempotente con `--add`, `--remove`, `--status`. Detecta dinámicamente la IP de Minikube, la IP LAN del host, y el bridge de Docker. |
| `k8s/deploy-local.sh` | Simplificado: ahora llama a `setup-host-networking.sh` en vez de tener la lógica inline. |
| `.github/workflows/deploy.yml` | Step nuevo: `sudo bash k8s/setup-host-networking.sh` como safety net post-deploy. |
| `docs/despliegue/produccion.md` | Sección nueva "Configurar red del host (iptables)" con pasos de persistencia. |
| `docs/pendientes/vm-linux.md` | Agregado paso 7 "Configurar red del host (iptables)". |
| `docs/incidente-docker-drop-forward.md` | **Nuevo.** Informe técnico del incidente Docker DOCKER-USER drop. |

## Script `setup-host-networking.sh`

```
Uso: bash k8s/setup-host-networking.sh [--remove|--status|--help]

  (sin argumentos)  Agrega las reglas iptables
  --remove, -r      Elimina las reglas iptables
  --status, -s      Muestra el estado de las reglas
  --help, -h        Muestra esta ayuda
```

Reglas que gestiona (todas para puerto 30080):

| Cadena | Tabla | Regla |
|---|---|---|
| PREROUTING | nat | DNAT → `<minikube_ip>:30080` |
| OUTPUT | nat | DNAT → `<minikube_ip>:30080` |
| FORWARD | filter | ACCEPT `daddr <minikube_ip> dport 30080` |
| DOCKER-USER | filter | ACCEPT `oif <docker_bridge> dport 30080` |

## Pendiente en producción

En la VM Linux de producción (`192.168.1.50`) ya se ejecutaron:

```bash
sudo bash k8s/setup-host-networking.sh
sudo apt install -y iptables-persistent
sudo netfilter-persistent save
```

## Pruebas de conectividad — resultados

### Red interna (192.168.1.0/24)

| Origen | Destino | Ping | Puerto | Resultado |
|---|---|---|---|---|
| Ubuntu Server (`1.50`) | pfSense LAN (`1.254`) | ✅ | — | OK |
| Ubuntu Server (`1.50`) | Internet (`8.8.8.8`) | ✅ | — | OK |
| Ubuntu Server (`1.50`) | AD (`1.10`) | ✅ | 389 (LDAP) | ✅ |
| Ubuntu Server (`1.50`) | AD (`1.10`) | ✅ | 636 (LDAPS) | ✅ |
| Ubuntu Server (`1.50`) | SQL (`1.102`) | ❌ | 1433 | ❌ Pendiente |
| AD (`1.10`) | Ubuntu Server (`1.50:30080`) | — | HTTP | ✅ Frontend accesible |
| Lubuntu | Ubuntu Server (`1.50:30080`) | — | HTTP | ✅ Frontend accesible |
| Host Windows | Ubuntu Server (`1.50:30080`) | — | HTTP | ❌ Pendiente (requiere pfSense) |

## Pendientes

- [ ] **Acceso desde host Windows:** configurar port forward en pfSense (`WAN:443 → 1.50:30080`) o SSH tunnel
- [ ] **SQL Server (`1.102`):** verificar VM encendida y firewall de Windows
- [ ] **Merge develop → main:** para activar CI/CD con el runner self-hosted
- [ ] **Configurar secrets de GitHub:** `SQL_SERVER`, `SQL_PASSWORD`, etc.
- [ ] **Despliegue automático:** confirmar que el runner de GitHub Actions está instalado

## Estado del repositorio

- `develop`: contiene todos los cambios mergeados
- `main`: sin cambios (pendiente de merge desde develop para activar CI/CD)
- Commits relevantes: `b8f1bdb`, `d0aafba`, `96e9a30`, `9d82f88` (PR merge)
