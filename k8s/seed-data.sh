#!/usr/bin/env bash
# Puebla SQL Server y MongoDB con datos semilla.
# Ejecutar DESPUÉS de deploy-core.sh (cuando el cluster ya esté funcionando).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NAMESPACE="inventario-itu"

echo "========================================"
echo "  Seed — SQL Server"
echo "========================================"

if [ -n "${SQL_SERVER:-}" ]; then
  cd "$ROOT/backend"
  node scripts/bootstrap.mjs
  cd "$ROOT"
  echo "✅ SQL Server seed completado"
else
  echo "⚠️  SQL_SERVER no definido — saltando bootstrap de SQL"
  echo "   Para seedear SQL, definir las variables SQL_SERVER, SQL_USER, etc."
fi

echo ""
echo "========================================"
echo "  Seed — MongoDB"
echo "========================================"

echo "==> ConfigMap con datos seed"
kubectl apply -f "$ROOT/k8s/mongo/configmap.yaml"

echo "==> Job de seed (idempotente)"
kubectl apply -f "$ROOT/k8s/mongo/seed-job.yaml"

echo "==> Esperar a que el Job complete..."
kubectl wait --for=condition=complete job/mongo-seed -n "$NAMESPACE" --timeout=120s
echo "✅ Job mongo-seed completado exitosamente"

echo ""
echo "========================================"
echo "  Resumen"
echo "========================================"
echo "SQL Server  → seedeado (si SQL_SERVER estaba definido)"
echo "MongoDB     → seedeado vía job mongo-seed"
echo ""
echo "Para verificar:"
echo "  kubectl logs job/mongo-seed -n $NAMESPACE"
