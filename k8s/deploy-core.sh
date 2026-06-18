#!/usr/bin/env bash
# Despliega el ecosistema base en Minikube (sin seed data).
# El cluster arranca limpio — los datos se seedean por separado con seed-data.sh.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NAMESPACE="inventario-itu"

echo "==> Namespace"
kubectl apply -f "$ROOT/k8s/namespace/"

echo "==> MongoDB (motor únicamente, sin seed)"
kubectl apply -f "$ROOT/k8s/mongo/deployment.yaml"
kubectl apply -f "$ROOT/k8s/mongo/service.yaml"
kubectl apply -f "$ROOT/k8s/mongo/pvc.yaml"

echo "==> Backend"
kubectl apply -f "$ROOT/k8s/backend/"

echo "==> Frontend"
kubectl apply -f "$ROOT/k8s/frontend/"

echo "==> Network Policies"
kubectl apply -f "$ROOT/k8s/network-policies/"

echo "==> Esperar pods — orden: mongo → backend → frontend"
kubectl rollout status deployment/inventario-db -n "$NAMESPACE" --timeout=120s
kubectl rollout status deployment/inventario-backend -n "$NAMESPACE" --timeout=180s
kubectl rollout status deployment/inventario-web -n "$NAMESPACE" --timeout=120s

echo "==> Reglas iptables host"
bash "$ROOT/k8s/setup-host-networking.sh"

echo "==> Smoke test"
POD=$(kubectl get pod -l app=inventario-backend -n "$NAMESPACE" -o jsonpath='{.items[0].metadata.name}')
kubectl exec "$POD" -n "$NAMESPACE" -- sh -c "
  curl -sf http://localhost:3001/health | grep -q status && echo 'SMOKE OK' || (echo 'SMOKE FAILED' && exit 1)
"

echo ""
echo "✅ Core desplegado — cluster funcionando sin datos seed"
echo "   Ejecutar: bash k8s/seed-data.sh   para poblar SQL Server y MongoDB"
