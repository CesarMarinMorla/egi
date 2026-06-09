#!/usr/bin/env bash
# Despliega el ecosistema en Minikube (imágenes locales).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Build imágenes en el daemon de Minikube"
eval "$(minikube docker-env)"
docker build -t inventario-web:latest "$ROOT/frontend"
docker build -t inventario-backend:latest "$ROOT/backend"

echo "==> Secret local (opcional, solo si usás GHCR)"
kubectl create secret docker-registry ghcr-credentials \
  --docker-server=ghcr.io \
  --docker-username=local \
  --docker-password=local \
  --namespace=inventario-itu \
  --dry-run=client -o yaml | kubectl apply -f - 2>/dev/null || true

echo "==> Aplicar manifiestos"
kubectl apply -f "$ROOT/k8s/namespace/"
kubectl apply -f "$ROOT/k8s/mongo/"
kubectl apply -f "$ROOT/k8s/backend/"
kubectl apply -f "$ROOT/k8s/frontend/"
kubectl apply -f "$ROOT/k8s/network-policies/"

echo "==> Esperar pods"
kubectl rollout status deployment/inventario-db -n inventario-itu --timeout=120s
kubectl rollout status deployment/inventario-backend -n inventario-itu --timeout=120s
kubectl rollout status deployment/inventario-web -n inventario-itu --timeout=120s

echo ""
echo "==> Exponer frontend en la red local"
MINIKUBE_IP=$(minikube ip)
HOST_LAN_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "")

IPTABLES=""
if command -v iptables &>/dev/null && [ -n "$HOST_LAN_IP" ]; then
  if [ "$(id -u)" -eq 0 ]; then
    IPTABLES="iptables"
  elif command -v sudo &>/dev/null; then
    IPTABLES="sudo iptables"
  fi
fi

if [ -n "$IPTABLES" ]; then
  $IPTABLES -t nat -C PREROUTING -p tcp --dport 30080 \
    -j DNAT --to-destination "${MINIKUBE_IP}:30080" 2>/dev/null ||
  $IPTABLES -t nat -A PREROUTING -p tcp --dport 30080 \
    -j DNAT --to-destination "${MINIKUBE_IP}:30080" 2>/dev/null || true
  $IPTABLES -C FORWARD -p tcp -d "$MINIKUBE_IP" --dport 30080 -j ACCEPT 2>/dev/null ||
  $IPTABLES -A FORWARD -p tcp -d "$MINIKUBE_IP" --dport 30080 -j ACCEPT 2>/dev/null || true
  echo "  DNAT activado: ${HOST_LAN_IP}:30080 → ${MINIKUBE_IP}:30080"
else
  echo "  Solo local (sin iptables): http://${MINIKUBE_IP}:30080"
fi

echo ""
echo "Frontend:"
echo "  http://${HOST_LAN_IP:-$(minikube ip)}:30080"
echo ""
echo "Detener (eliminar reglas iptables):"
echo "  iptables -t nat -D PREROUTING -p tcp --dport 30080 -j DNAT --to-destination ${MINIKUBE_IP}:30080"
