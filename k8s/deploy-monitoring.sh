#!/usr/bin/env bash
# Despliega Uptime Kuma (monitoreo) en Minikube.
# Ejecutar después de deploy-core.sh si se desea monitoreo.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NAMESPACE="inventario-itu"

echo "==> Uptime Kuma"
kubectl apply -f "$ROOT/k8s/monitoring/"

echo "==> Network Policy (allow-uptime-kuma-egress)"
kubectl apply -f "$ROOT/k8s/network-policies/allow-uptime-kuma-egress.yaml"

echo "==> Esperar pod"
kubectl rollout status deployment/inventario-uptime-kuma -n "$NAMESPACE" --timeout=120s

echo ""
echo "Uptime Kuma desplegado — acceder en http://<NODE_IP>:30081"
echo "Recordar agregar regla NAT en pfSense si se necesita desde la LAN."
