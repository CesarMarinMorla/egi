#!/usr/bin/env bash
# Configura reglas iptables para exponer el NodePort de Minikube en la LAN.
# Uso:
#   bash k8s/setup-host-networking.sh            # agregar reglas
#   bash k8s/setup-host-networking.sh --remove   # eliminar reglas
#   bash k8s/setup-host-networking.sh --status   # ver estado
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MINIKUBE_IP=""
HOST_LAN_IP=""
DOCKER_BRIDGE=""
IPTABLES_CMD=""
NODE_PORT=30080

# Cuando se ejecuta con sudo, minikube no encuentra el perfil del usuario.
# Detectamos el usuario original para ejecutar comandos de minikube con él.
if [ "$(id -u)" -eq 0 ] && [ -n "${SUDO_USER:-}" ]; then
  MINIKUBE_CMD="sudo -u \"$SUDO_USER\" minikube"
else
  MINIKUBE_CMD="minikube"
fi

resolve_ips() {
  if ! MINIKUBE_IP=$(bash -c "$MINIKUBE_CMD ip" 2>/dev/null); then
    echo "Error: minikube no está corriendo o no instalado"
    exit 1
  fi
  HOST_LAN_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "")
  # Detecta la interfaz bridge de Docker que conecta con Minikube
  local subnet
  subnet=$(echo "$MINIKUBE_IP" | awk -F. '{print $1"."$2"."$3".0"}')
  DOCKER_BRIDGE=$(ip route | grep "$subnet" | awk '{print $3}' | head -1)
  if [ -z "$DOCKER_BRIDGE" ]; then
    echo "Error: no se encontró ruta hacia $MINIKUBE_IP"
    exit 1
  fi
}

detect_iptables() {
  if ! command -v iptables &>/dev/null; then
    echo "Error: iptables no está instalado"
    exit 1
  fi
  if [ "$(id -u)" -eq 0 ]; then
    IPTABLES_CMD="iptables"
  elif command -v sudo &>/dev/null; then
    IPTABLES_CMD="sudo iptables"
  else
    echo "Error: se requiere root o sudo para ejecutar iptables"
    exit 1
  fi
}

check_driver() {
  local driver
  driver=$(bash -c "$MINIKUBE_CMD config get driver" 2>/dev/null || echo "docker")
  if [ "$driver" = "docker" ]; then
    echo "  Driver: docker — se requieren reglas DNAT"
  else
    echo "  Driver: $driver — puede que no necesites reglas DNAT"
  fi
}

ensure_rule() {
  local table="$1"
  local chain="$2"
  local rule="$3"
  if $IPTABLES_CMD -t "$table" -C "$chain" $rule 2>/dev/null; then
    echo "  ✓ $table/$chain ya existe"
  else
    $IPTABLES_CMD -t "$table" -A "$chain" $rule
    echo "  + $table/$chain agregada"
  fi
}

remove_rule() {
  local table="$1"
  local chain="$2"
  local rule="$3"
  if $IPTABLES_CMD -t "$table" -C "$chain" $rule 2>/dev/null; then
    $IPTABLES_CMD -t "$table" -D "$chain" $rule
    echo "  - $table/$chain eliminada"
  else
    echo "  ~ $table/$chain no existe (omitido)"
  fi
}

rules_add() {
  echo "==> Agregando reglas iptables"
  echo "  Minikube IP:  $MINIKUBE_IP"
  echo "  Host LAN IP:  ${HOST_LAN_IP:-<no detectada>}"
  echo "  Docker bridge: $DOCKER_BRIDGE"
  echo "  Puerto:       $NODE_PORT"
  echo ""
  check_driver
  echo ""

  ensure_rule nat PREROUTING \
    "-p tcp --dport $NODE_PORT -j DNAT --to-destination ${MINIKUBE_IP}:${NODE_PORT}"
  ensure_rule nat OUTPUT \
    "-p tcp --dport $NODE_PORT -j DNAT --to-destination ${MINIKUBE_IP}:${NODE_PORT}"
  ensure_rule filter FORWARD \
    "-p tcp -d $MINIKUBE_IP --dport $NODE_PORT -j ACCEPT"
  ensure_rule filter DOCKER-USER \
    "-o $DOCKER_BRIDGE -p tcp --dport $NODE_PORT -j ACCEPT"

  echo ""
  echo "Frontend: http://${HOST_LAN_IP:-$MINIKUBE_IP}:$NODE_PORT"
}

rules_remove() {
  echo "==> Eliminando reglas iptables"

  remove_rule nat PREROUTING \
    "-p tcp --dport $NODE_PORT -j DNAT --to-destination ${MINIKUBE_IP}:${NODE_PORT}"
  remove_rule nat OUTPUT \
    "-p tcp --dport $NODE_PORT -j DNAT --to-destination ${MINIKUBE_IP}:${NODE_PORT}"
  remove_rule filter FORWARD \
    "-p tcp -d $MINIKUBE_IP --dport $NODE_PORT -j ACCEPT"
  remove_rule filter DOCKER-USER \
    "-o $DOCKER_BRIDGE -p tcp --dport $NODE_PORT -j ACCEPT"

  echo ""
  echo "Reglas eliminadas. Podés verificarlo con: $0 --status"
}

rules_status() {
  echo "==> Estado de reglas iptables (puerto $NODE_PORT)"
  echo ""

  local found=false
  for table in nat filter; do
    local out
    out=$($IPTABLES_CMD -t "$table" -L -n -v 2>/dev/null | grep "$NODE_PORT" || true)
    if [ -n "$out" ]; then
      echo "--- table $table ---"
      $IPTABLES_CMD -t "$table" -L -n -v 2>/dev/null | grep --color=auto "$NODE_PORT" || true
      found=true
    fi
  done

  # Also check DOCKER-USER chain specifically
  local docker_out
  docker_out=$($IPTABLES_CMD -L DOCKER-USER -n -v 2>/dev/null | grep "$NODE_PORT" || true)
  if [ -n "$docker_out" ]; then
    echo "--- chain DOCKER-USER ---"
    $IPTABLES_CMD -L DOCKER-USER -n -v 2>/dev/null | grep --color=auto "$NODE_PORT" || true
    found=true
  fi

  if ! $found; then
    echo "  No se encontraron reglas para el puerto $NODE_PORT"
  fi
}

resolve_ips
detect_iptables

case "${1:-}" in
  --remove|-r)
    rules_remove
    ;;
  --status|-s)
    rules_status
    ;;
  --help|-h)
    echo "Uso: $0 [--remove|--status|--help]"
    echo ""
    echo "  (sin argumentos)  Agrega las reglas iptables"
    echo "  --remove, -r      Elimina las reglas iptables"
    echo "  --status, -s      Muestra el estado de las reglas"
    echo "  --help, -h        Muestra esta ayuda"
    ;;
  *)
    rules_add
    ;;
esac
