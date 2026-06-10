# Informe de incidente: tráfico externo al bridge de Docker descartado por la cadena DOCKER

## Resumen

Al intentar acceder al frontend del proyecto (`inventario-web`, NodePort `:30080`) desde máquinas virtuales externas al bridge de Docker (por ejemplo, VMs en virt-manager/libvirt en la red `192.168.122.0/24`), el tráfico TCP era descartado silenciosamente. La conexión quedaba en timeout sin recibir SYN-ACK.

## Síntomas

| Origen | Destino | Resultado |
|---|---|---|
| Host local | `172.22.75.65:30080` | 200 OK |
| Host local | `192.168.49.2:30080` (minikube) | 200 OK |
| VM (virt-manager, `192.168.122.151`) | `192.168.122.1:30080` | Timeout |
| VM (virt-manager) | `192.168.49.2:30080` | Timeout |
| ping desde VM al host | `192.168.122.1` | 0% pérdida |
| SSH desde VM al host | `192.168.122.1:22` | Conexión exitosa |

El ping y SSH a la IP del host funcionaban. TCP al puerto 30080 fallaba exclusivamente.

## Trazado de red y detección

### 1. Conectividad básica verificada

Desde la VM se confirmó conectividad completa contra el host:

```bash
ping -c 3 192.168.122.1     # 0% pérdida
nc -zv 192.168.122.1 22     # SSH conecta
curl http://8.8.8.8         # Internet funciona
nslookup google.com         # DNS resuelve
```

### 2. Flujo de paquetes esperado

```
VM (192.168.122.151) → 192.168.122.1:30080
  → PREROUTING DNAT → 192.168.49.2:30080
  → Routing (cambio de interfaz: virbr0 → br-30e7da67ea92)
  → FORWARD
  → br-30e7da67ea92 → Minikube (192.168.49.2)
```

### 3. Reglas iptables verificadas

Se inspeccionaron las cadenas PREROUTING, FORWARD y DOCKER en el filter table:

```bash
# Reglas DNAT activas (PREROUTING y OUTPUT)
sudo iptables -t nat -L PREROUTING -n -v | grep 30080
sudo iptables -t nat -L OUTPUT -n -v | grep 30080

# Regla FORWARD
sudo iptables -L FORWARD -n -v | grep 30080
```

Las tres reglas existían pero el contador de la regla FORWARD era **0 paquetes**, indicando que el paquete nunca la alcanzaba.

### 4. Inspección de la cadena DOCKER en nftables

```bash
sudo nft list chain ip filter DOCKER
```

Salida:

```
chain DOCKER {
    ip daddr 192.168.49.2 iifname != "br-30e7da67ea92" oifname "br-30e7da67ea92" tcp dport 32443 accept
    ...
    iifname != "docker0" oifname "docker0" drop
    iifname != "br-30e7da67ea92" oifname "br-30e7da67ea92" counter packets 237 bytes 14812 drop
}
```

La última línea reveló el problema:

```
iifname != "br-30e7da67ea92" oifname "br-30e7da67ea92" drop
                                         ^^^^^^^^^^^^^^^
                         Paquete entrando por virbr0, saliendo por el bridge de Docker → DROPPED
```

El contador `237 packets / 14812 bytes` confirmó que las conexiones intentadas estaban siendo descartadas aquí.

## Causa raíz

Docker, cuando se ejecuta con el backend `iptables-nft`, inserta una cadena `DOCKER` en la tabla `filter` del firewall. Esta cadena incluye una regla de **descarte genérico** al final:

```
iifname != "br-30e7da67ea92" oifname "br-30e7da67ea92" drop
```

**Interpretación:** todo paquete que **no** entre por la interfaz `br-30e7da67ea92` (el bridge de Docker para Minikube) pero que esté destinado a salir por ella, es descartado. Esto incluye tráfico proveniente de:

- VMs de libvirt (interfaz `virbr0`)
- VMs de VirtualBox (interfaz `vboxnet`)
- Interfaces virtuales de otros hipervisores
- Otras interfaces físicas (PCI passthrough, USB tethering, etc.)

La regla existe por diseño para **aislar el bridge de Docker** de tráfico externo no autorizado, evitando que contenedores sean accesibles desde redes que Docker no gestiona. Docker solo abre excepciones para puertos específicos expuestos con `docker run -p` (en este caso, solo los puertos `22`, `2376`, `5000`, `8443`, `32443` del contenedor de Minikube).

## Solución

### Estrategia

Docker provee una cadena especial llamada **`DOCKER-USER`** en la tabla `filter`. Las reglas insertadas en `DOCKER-USER` son evaluadas **antes** que las reglas internas de Docker en `DOCKER`, y **Docker no las modifica ni las elimina** al reiniciar el servicio ni al crear/eliminar contenedores.

Insertar una regla de aceptación en `DOCKER-USER` para el puerto 30080 resuelve el problema sin interferir con el resto de las políticas de Docker.

### Cambio aplicado

En el script `k8s/setup-host-networking.sh`:

```bash
# Antes: solo reglas DNAT + FORWARD
ensure_rule nat PREROUTING     "-p tcp --dport $NODE_PORT -j DNAT --to-destination ${MINIKUBE_IP}:${NODE_PORT}"
ensure_rule nat OUTPUT         "-p tcp --dport $NODE_PORT -j DNAT --to-destination ${MINIKUBE_IP}:${NODE_PORT}"
ensure_rule filter FORWARD     "-p tcp -d $MINIKUBE_IP --dport $NODE_PORT -j ACCEPT"

# Después: se agregó una cuarta regla en DOCKER-USER
ensure_rule filter DOCKER-USER "-o $DOCKER_BRIDGE -p tcp --dport $NODE_PORT -j ACCEPT"
```

La regla en `DOCKER-USER` requiere la interfaz bridge de Docker, la cual se detecta dinámicamente porque su nombre (`br-<random>`) cambia en cada máquina:

```bash
subnet=$(echo "$MINIKUBE_IP" | awk -F. '{print $1"."$2"."$3".0"}')
DOCKER_BRIDGE=$(ip route | grep "$subnet" | awk '{print $3}' | head -1)
```

No existía una versión previa con el bridge hardcodeado — el script original directamente no tenía la regla `DOCKER-USER`.

### Comandos equivalentes manuales

```bash
# Agregar la excepción
sudo iptables -I DOCKER-USER -o br-30e7da67ea92 -p tcp --dport 30080 -j ACCEPT

# Eliminar la excepción
sudo iptables -D DOCKER-USER -o br-30e7da67ea92 -p tcp --dport 30080 -j ACCEPT
```

### Resultado final

| Cadena | Tabla | Regla | Estado |
|---|---|---|---|
| PREROUTING | nat | `dpt:30080 → DNAT 192.168.49.2:30080` | ✓ |
| OUTPUT | nat | `dpt:30080 → DNAT 192.168.49.2:30080` | ✓ |
| FORWARD | filter | `daddr 192.168.49.2 dpt:30080 ACCEPT` | ✓ |
| **DOCKER-USER** | **filter** | **`oif br-30e7da67ea92 dpt:30080 ACCEPT`** | **✓ nueva** |

## Lecciones aprendidas

1. Docker no solo gestiona reglas en `nat` para port mapping, sino que también inyecta reglas de filtrado en la tabla `filter`. La cadena `DOCKER` descarta tráfico no autorizado hacia sus bridges.

2. La cadena `DOCKER-USER` es el mecanismo oficial de Docker para que los administradores agreguen reglas personalizadas que Docker respeta y nunca sobrescribe.

3. El contador de paquetes en iptables/nftables es la herramienta más efectiva para diagnosticar dónde se pierde el tráfico. Un contador en 0 indica que el paquete nunca llegó a esa regla; un contador que aumenta indica dónde se está procesando (o descartando).

4. Al inspeccionar cadenas de iptables, es necesario revisar **todas** las tablas, no solo `nat`. La regla problemática estaba en la tabla `filter`, en una cadena específica de Docker (`DOCKER`).

## Referencias

- [Docker y iptables — documentación oficial](https://docs.docker.com/network/packet-filtering-firewalls/)
- Script de configuración: `k8s/setup-host-networking.sh`
- Branch: `fix/docker-user-iptables` (commit `49ec0fe`)
