# Despliegue — Kubernetes (Minikube)

Backend, frontend y MongoDB corriendo en Minikube.

## Requisitos

- Minikube + Docker
- Node.js 20+

## Paso a paso

```bash
# 1. Iniciar Minikube (con Calico para network policies)
minikube start --cni=calico

# 2. Build imágenes en el daemon de Minikube
eval $(minikube docker-env)
docker build -t inventario-web:latest frontend/
docker build -t inventario-backend:latest backend/

# 3. Aplicar manifiestos
kubectl apply -f k8s/namespace/
kubectl apply -f k8s/mongo/
kubectl apply -f k8s/backend/
kubectl apply -f k8s/frontend/
kubectl apply -f k8s/network-policies/

# 4. Esperar a que los pods estén listos
kubectl rollout status deployment/inventario-db -n inventario-itu --timeout=120s
kubectl rollout status deployment/inventario-backend -n inventario-itu --timeout=120s
kubectl rollout status deployment/inventario-web -n inventario-itu --timeout=120s
```

O el script automatizado:

```bash
bash k8s/deploy-local.sh
```

## Verificación

```bash
kubectl get pods -n inventario-itu
# NAME                                  READY   STATUS    RESTARTS   AGE
# inventario-backend-7864fbff4f-q8gcw   1/1     Running   0          87s
# inventario-db-65798c85c5-7qbxb        1/1     Running   0          88s
# inventario-web-57f79d7756-4rbph       1/1     Running   0          87s

kubectl get svc -n inventario-itu
# NAME                 TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)
# inventario-backend   ClusterIP   10.99.224.254   <none>        3001/TCP
# inventario-db        ClusterIP   10.96.96.246    <none>        27017/TCP
# inventario-web       NodePort    10.96.72.235    <none>        80:30080/TCP
```

## Persistencia

| Dato            | Backend                 | K8s                                 |
| --------------- | ----------------------- | ----------------------------------- |
| Máquinas        | SQL Server (`machines`) | `192.168.1.20:1433` (VMs reales)    |
| Hardware        | MongoDB (`hardware`)    | `inventario-db:27017` (dentro del cluster) |
| Usuarios / Auth | AD (`192.168.1.10:389`) | AD (`192.168.1.10:389`)             |

> El Secret ahora tiene `MOCK_MODE: "false"` por defecto. Para probar solo localmente sin las VMs, cambiarlo a `MOCK_MODE: "true"` y comentar las configs de SQL, MongoDB y LDAP.

## Acceso desde la red local

Minikube con driver `docker` aísla el cluster en una red interna (`192.168.49.0/24`). El NodePort `30080` solo es accesible desde la máquina que ejecuta Minikube.

El script `deploy-local.sh` configura automáticamente una regla `iptables DNAT` en Linux para redirigir el tráfico desde la IP local de la máquina hacia el cluster:

```
192.168.1.50:30080  ──DNAT──>  192.168.49.2:30080  ──NodePort──>  Pod nginx:80
```

Esto simula el NAT que haría pfSense en producción.

| Plataforma | Acceso al frontend                     |
| ---------- | -------------------------------------- |
| Linux      | `http://192.168.1.50:30080`             |
| macOS      | `kubectl port-forward -n inventario-itu svc/inventario-web 8080:80 --address=0.0.0.0` |

> Sin `--address=0.0.0.0` el port-forward solo escucha en `127.0.0.1` y no es accesible desde otras máquinas de la red. Alternativa: `minikube tunnel &`

Para eliminar las reglas iptables manualmente:

```bash
iptables -t nat -D PREROUTING -p tcp --dport 30080 \
  -j DNAT --to-destination $(minikube ip):30080
```

## Notas

- Las imágenes `inventario-web` e `inventario-backend` se construyen localmente en el daemon de Minikube (no están en ningún registry). `mongo:4.4` se pullea de Docker Hub.
- El backend arranca en **modo real** (`MOCK_MODE=false`) y se conecta a SQL Server, MongoDB y AD en las VMs de la red local.
- El health check del backend está en `/health` (no `/api/health`).

## Arquitectura

```mermaid
flowchart TB
    subgraph External[" "]
        User(["User"])
        SQL[("SQL Server<br/>192.168.56.30:1433")]
        AD[("Active Directory<br/>192.168.56.40:389")]
    end

    subgraph FW["pfSense Firewall"]
        direction TB
        TLS["TLS termination<br/>443 → NodePort 30080"]
        NAT["NAT / ACL<br/>solo cluster → VMs"]
        WAF["WAF / rate limiting"]
    end

    subgraph Cluster["Minikube — inventario-itu"]
        direction TB

        subgraph Web["Frontend"]
            WebSvc("Service<br/>NodePort 80:30080")
            WebPod["Pod inventario-web<br/>port 80"]
        end

        subgraph Be["Backend"]
            BeSvc("Service<br/>ClusterIP :3001")
            BePod["Pod inventario-backend<br/>port 3001"]
            BeSec{{"Secret<br/>JWT, mock-mode, SQL"}}
        end

        subgraph Mongo["MongoDB"]
            MongoSvc("Service<br/>ClusterIP :27017")
            MongoPod["Pod inventario-db<br/>port 27017"]
            MongoPvc["PVC 1Gi"]
        end

        subgraph NP["Network Policies"]
            NP01["deny-all-default"]
            NP02["allow-dns-egress"]
            NP03["allow-ingress-web"]
            NP04["allow-web-to-backend"]
            NP05["allow-backend-to-mongo"]
            NP06["allow-backend-egress-sql"]
            NP07["allow-backend-egress-ad"]
        end
    end

    User -->|":443 HTTPS"| TLS
    TLS -->|":30080"| WebSvc
    WebSvc --> WebPod
    WebPod -->|":3001"| BeSvc
    BeSvc --> BePod
    BePod -->|":27017"| MongoSvc
    MongoSvc --> MongoPod
    MongoPod --> MongoPvc
    BePod -.->|"egress :1433"| NAT
    BePod -.->|"egress :389"| NAT
    NAT -.->|":1433"| SQL
    NAT -.->|":389"| AD
    BePod -.- BeSec
```

## Servicios expuestos

| Servicio | Tipo      | Puerto interno | NodePort |
| -------- | --------- | -------------- | -------- |
| Frontend | NodePort  | `80`           | `30080`  |
| Backend  | ClusterIP | `3001`         | —        |
| MongoDB  | ClusterIP | `27017`        | —        |

## Detener

```bash
minikube delete
```
