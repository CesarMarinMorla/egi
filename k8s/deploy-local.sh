#!/usr/bin/env bash
# Despliegue completo local: build imágenes + core + seed data.
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

echo ""
echo "========================================"
echo "  Fase 1 — Core (cluster sin datos)"
echo "========================================"
bash "$ROOT/k8s/deploy-core.sh"

echo ""
echo "========================================"
echo "  Fase 2 — Seed data"
echo "========================================"
bash "$ROOT/k8s/seed-data.sh"

echo ""
echo "✅ Despliegue local completo"
