# Despliegue — Modo Mock

Backend y frontend funcionan completamente con datos mock en memoria. No requiere Docker ni bases de datos.

```bash
# Terminal 1 — backend
cd backend
npm install
npm run dev
# → http://localhost:3001 (mock mode)

# Terminal 2 — frontend
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

El backend arranca en mock por defecto (no necesita `.env`).  
El frontend usa `VITE_USE_MOCK=true` (se define en `.env.development`).

## Verificación

```bash
curl http://localhost:3001/health
# → {"status":"ok","mockMode":true}
```

## Detener

```bash
killall tsx vite
```
