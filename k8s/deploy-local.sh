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
bash "$ROOT/k8s/setup-host-networking.sh"
