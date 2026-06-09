# Setup — VM Linux / Minikube (192.168.1.50)

## 1. Crear la VM en VirtualBox

| Campo | Valor |
|---|---|
| OS | Ubuntu Server 24.04 LTS (64-bit) |
| RAM | 3072 MB |
| CPUs | 2 |
| Disco | 20 GB |
| Red | Adaptador interno (misma red que pfSense LAN) |

## 2. Asignar IP fija

Editar `/etc/netplan/00-installer-config.yaml`:

```yaml
network:
  ethernets:
    enp0s3:
      addresses: [192.168.1.50/24]
      routes:
        - to: default
          via: 192.168.1.254
      nameservers:
        addresses: [8.8.8.8, 1.1.1.1]
  version: 2
```

```bash
sudo netplan apply
```

## 3. Instalar dependencias

```bash
# Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# kubectl
curl -LO "https://dl.k8s.io/release/$(curl -sL https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Git
sudo apt-get install -y git
```

## 4. Iniciar Minikube

```bash
minikube start --cni=calico --memory=3072 --cpus=2
minikube status
```

## 5. Clonar el repo

```bash
git clone https://github.com/<org>/<repo>.git
cd <repo>
```

## 6. Configurar secret en modo real

Editar `k8s/backend/secret.yaml` — descomentar y completar:

```yaml
MOCK_MODE: "false"
JWT_SECRET: "<output de: openssl rand -base64 32>"
SQL_SERVER: "192.168.1.102"
SQL_PORT: "1433"
SQL_USER: "sa"
SQL_PASSWORD: "Mysql123"
SQL_DATABASE: "inventario_itu"
SQL_ENCRYPT: "false"
MONGO_URI: "mongodb://inventario-db:27017"
MONGO_DB_NAME: "inventario"
LDAP_URL: "ldap://192.168.1.10:389"
LDAP_SEARCH_BASE: "DC=itu,DC=local"
LDAP_BIND_DN: "CN=svc-inventario,CN=Users,DC=itu,DC=local"
LDAP_BIND_PASSWORD: "<password>"
LDAP_SEARCH_FILTER: "(sAMAccountName={username})"
```

## 7. Configurar red del host (iptables)

Minikube con driver `docker` aísla los NodePorts en una red interna. Se requiere DNAT para acceso desde la LAN.

```bash
# Ejecutar una sola vez
sudo bash k8s/setup-host-networking.sh

# Hacer persistente (sobrevive reinicios)
sudo apt install -y iptables-persistent
sudo netfilter-persistent save

# Verificar
curl http://192.168.1.50:30080
```

## 8. Instalar el GitHub Actions Runner

En GitHub: **repo → Settings → Actions → Runners → New self-hosted runner → Linux x64**. Seguir los comandos que genera GitHub. Al final:

```bash
# Instalar como servicio (arranca automático con la VM)
sudo ./svc.sh install
sudo ./svc.sh start

# Verificar
sudo ./svc.sh status
```

## 9. Cargar secrets en GitHub

En **repo → Settings → Secrets and variables → Actions**:

| Secret | Valor |
|---|---|
| `SQL_SERVER` | `192.168.1.102` |
| `SQL_PORT` | `1433` |
| `SQL_USER` | `sa` |
| `SQL_PASSWORD` | `Mysql123` |
| `SQL_DATABASE` | `inventario_itu` |
| `SQL_ENCRYPT` | `false` |

## 10. Primer deploy

```bash
# Desde el repo en la VM — deploy manual inicial
bash k8s/deploy-local.sh

# Verificar pods
kubectl get pods -n inventario-itu

# Verificar acceso
curl http://localhost:30080
```

Luego hacer un push a `main` para verificar que el pipeline de GitHub Actions corre completo.
