# Flujograma — Inventario ITU

> **Asignatura:** Proyecto Integrador
> **Sistema:** Inventario ITU — Gestión centralizada de activos informáticos
> **Tecnologías:** React 19 + Node.js/Express 5 + SQL Server + MongoDB + LDAP/AD + Kubernetes

---

## 1. Flujo de autenticación y control de acceso

```mermaid
flowchart TD
    A([Usuario ingresa a la URL]) --> B{Carga la app en el navegador}
    B --> C{¿Token JWT válido en localStorage?}
    C -->|No| D[Redirigir a /login]
    C -->|Sí| E[Validar token con backend]
    E --> F{Token expirado o inválido?}
    F -->|Sí| D
    F -->|No| G[Ir a /dashboard]
    
    D --> H[Mostrar formulario de login]
    H --> I[Usuario ingresa credenciales]
    I --> J[POST /api/auth/login]
    J --> K[Backend busca usuario en AD/LDAP]
    K --> L{¿Usuario existe?}
    L -->|No| M[Error: credenciales inválidas]
    M --> H
    L -->|Sí| N[Validar contraseña contra AD]
    N --> O{¿Contraseña correcta?}
    O -->|No| M
    O -->|Sí| P[Obtener grupos AD del usuario]
    P --> Q[Mapear grupos a roles del sistema]
    Q --> R[Firmar JWT con rol y permisos]
    R --> S[Devolver token al frontend]
    S --> T[Guardar token en localStorage]
    T --> G

    style A fill:#1a73e8,color:#fff
    style G fill:#34a853,color:#fff
    style D fill:#ea4335,color:#fff
    style M fill:#ea4335,color:#fff
```

---

## 2. Mapa de navegación principal

```mermaid
flowchart LR
    A([/login]):::login -->|Autenticación exitosa| B([/dashboard]):::dashboard
    B -->|Ver todos los equipos| C([/machines/:id]):::detail
    B -->|Gestionar usuarios AD| D([/users]):::users
    C -->|Volver| B
    D -->|Volver| B
    E([/*]):::notfound -->|URL inválida| F[404 - Página no encontrada]
    F -->|Navegar a| B

    classDef login fill:#ea4335,color:#fff
    classDef dashboard fill:#1a73e8,color:#fff
    classDef detail fill:#34a853,color:#fff
    classDef users fill:#f9ab00,color:#fff
    classDef notfound fill:#666,color:#fff
```

---

## 3. Flujo de gestión de inventario (Dashboard)

```mermaid
flowchart TD
    A([Dashboard principal]) --> B[Solicitar GET /api/machines]
    B --> C{Backend recibe request}
    C --> D[Middleware auth: validar JWT]
    D --> E{¿Token válido?}
    E -->|No| F[401 Unauthorized]
    E -->|Sí| G[Middleware RBAC: verificar permiso]
    G --> H{¿Rol tiene permiso machines:list?}
    H -->|No| I[403 Forbidden]
    H -->|Sí| J[Repositorio SQL Server]
    J --> K[SELECT * FROM machines ORDER BY lab, bench_number]
    K --> L[Mapear filas a objetos Machine]
    L --> M[Devolver JSON con lista de máquinas]
    M --> N[Frontend renderiza MachineTable]
    
    N --> O[Usuario hace clic en una máquina]
    O --> P[Navegar a /machines/:id]
    P --> Q[Solicitar GET /api/machines/:id]
    Q --> R[Repositorio SQL Server]
    R --> S[SELECT * FROM machines WHERE id = :id]
    S --> T{Máquina encontrada?}
    T -->|No| U[404 Not Found]
    T -->|Sí| V[Solicitar GET /api/hardware/:machineId]
    V --> W[Repositorio MongoDB]
    W -->     X[db.hardware.findOne &#40;machineId&#41;]
    X --> Y{¿Hardware existe?}
    Y -->|No| Z[Devolver machine sin hardware]
    Y -->|Sí| AA[Devolver machine + hardware]
    
    AA --> AB[Frontend renderiza MachineDetail]
    AB --> AC[LocationPanel: datos de SQL Server]
    AB --> AD[HardwarePanel: datos de MongoDB]

    style A fill:#1a73e8,color:#fff
    style I fill:#ea4335,color:#fff
    style F fill:#ea4335,color:#fff
    style U fill:#ea4335,color:#fff
```

---

## 4. Flujo de operaciones CRUD

### 4.1 Crear máquina

```mermaid
flowchart TD
    A([Dashboard]) --> B[Usuario hace clic en + Nueva máquina]
    B --> C[Modal: MachineFormModal]
    C --> D[Completar formulario hostname, lab, bench, etc.]
    D --> E[Validación Zod en frontend]
    E --> F{¿Datos válidos?}
    F -->|No| G[Mostrar errores de validación]
    G --> D
    F -->|Sí| H[Sanitizar contra XSS]
    H --> I[POST /api/machines]
    I --> J[Middleware auth + RBAC]
    J --> K{¿Permiso machines:create?}
    K -->|No| L[403 Forbidden]
    K -->|Sí| M[Repositorio SQL Server]
    M --> N[INSERT INTO machines OUTPUT INSERTED.id]
    N --> O[Devolver machine creada]
    O --> P[Cerrar modal y refrescar tabla]
```

### 4.2 Editar hardware

```mermaid
flowchart TD
    A([MachineDetail]) --> B[Usuario hace clic en Editar hardware]
    B --> C[Modal: HardwareFormModal]
    C --> D[Cargar datos actuales desde MongoDB]
    D --> E[Modificar campos: CPU, RAM, Disco, SO, etc.]
    E --> F[Validación Zod en frontend]
    F --> G{¿Datos válidos?}
    G -->|No| H[Mostrar errores]
    H --> E
    G -->|Sí| I[Sanitizar contra XSS]
    I --> J[PUT /api/hardware/:machineId]
    J --> K[Middleware auth + RBAC]
    K --> L{¿Permiso hardware:update?}
    L -->|No| M[403 Forbidden]
    L -->|Sí| N[Repositorio MongoDB]
    N --> O[db.hardware.updateOne &#40;machineId, $set&#41;]
    O --> P{¿Documento existía?}
    P -->|No| Q[db.hardware.insertOne &#40;machineId, ...&#41;]
    P -->|Sí| R[Actualización confirmada]
    Q --> R
    R --> S[Devolver hardware actualizado]
    S --> T[Cerrar modal y refrescar panel]
```

### 4.3 Eliminar máquina

```mermaid
flowchart TD
    A([Dashboard]) --> B[Usuario hace clic en Eliminar]
    B --> C[Modal de confirmación]
    C --> D{¿Confirmar?}
    D -->|No| E[Cancelar]
    D -->|Sí| F[DELETE /api/machines/:id]
    F --> G[Middleware auth + RBAC]
    G --> H{¿Permiso machines:delete?}
    H -->|No| I[403 Forbidden]
    H -->|Sí| J[Transacción: 1. Eliminar hardware de MongoDB]
    J --> K[db.hardware.deleteOne &#40;machineId&#41;]
    K --> L[2. Eliminar machine de SQL Server]
    L --> M[DELETE FROM machines WHERE id = :id]
    M --> N{¿Ambas operaciones exitosas?}
    N -->|No| O[Rollback implícito y error 500]
    N -->|Sí| P[204 No Content]
    P --> Q[Refrescar tabla de máquinas]
```

---

## 5. Flujo de gestión de usuarios AD

```mermaid
flowchart TD
    A([Dashboard]) --> B[Usuario con rol admin navega a /users]
    B --> C[GET /api/users]
    C --> D[Middleware auth + RBAC]
    D --> E{¿Permiso users:list?}
    E -->|No| F[403 Forbidden]
    E -->|Sí| G[Repositorio LDAP]
    G --> H[ldap.search en OU=EGI,DC=itu,DC=local]
    H --> I[Devolver lista de usuarios AD]
    I --> J[Frontend renderiza UserTable]
    
    J --> K[Crear usuario]
    J --> L[Editar usuario]
    J --> M[Eliminar usuario]
    J --> N[Buscar/filtrar]

    K --> O[UserFormModal → POST /api/users → ldap.add]
    L --> P[UserFormModal → PUT /api/users/:id → ldap.modify]
    M --> Q[Confirmación → DELETE /api/users/:id → ldap.del]
    N --> R[Búsqueda en frontend por username/displayName]
```

---

## 6. Flujo de logout y expiración de sesión

```mermaid
flowchart TD
    A([Usuario activo]) --> B{Dos condiciones posibles}
    B -->|Usuario hace clic en Cerrar sesión| C[Limpiar token de localStorage]
    B -->|Token JWT expira| D[Backend devuelve 401]
    C --> E[Redirigir a /login]
    D --> F[Frontend intercepta 401]
    F --> G[Limpiar token de localStorage]
    G --> E
```

---

## 7. Diagrama de integración entre servicios

```mermaid
flowchart TD
    subgraph "Cliente (Navegador)"
        A[React SPA]:::front
    end

    subgraph "Minikube Cluster"
        subgraph "Namespace: inventario-itu"
            B[Frontend Pod\nnginx:1.27\npuerto 80]:::front
            C[Backend Pod\nNode.js/Express\npuerto 3001]:::back
            D[MongoDB Pod\nmongo:4.4\npuerto 27017]:::mongo
        end
    end

    subgraph "Red Interna 192.168.1.0/24"
            E[SQL Server\nITUSRV002\n192.168.1.20:1433]:::sql
            F[Active Directory\n192.168.1.10:389]:::ad
    end

    A <-->|HTTP :30080| B
    B -->|localhost:3001| C
    C --> D
    C -->|NetworkPolicy allow-backend-egress-sql| E
    C -->|NetworkPolicy allow-backend-egress-ad| F

    classDef front fill:#1a73e8,color:#fff
    classDef back fill:#34a853,color:#fff
    classDef mongo fill:#f9ab00,color:#fff
    classDef sql fill:#ea4335,color:#fff
    classDef ad fill:#9334e6,color:#fff
```

---

## Leyenda

| Símbolo | Significado |
|---------|-------------|
| `[Rectángulo]` | Proceso / acción |
| `{Rombo}` | Decisión / condición |
| `([Paralelogramo])` | Inicio / fin |
| `( )` | Conector / página |
| Línea continua | Flujo normal |
| Línea punteada | Flujo alternativo / error |

---

## Roles y permisos del sistema

| Rol | Grupos AD | Permisos |
|-----|-----------|----------|
| **sysadmin** | GRP_Sysadmin | CRUD completo en máquinas, hardware y usuarios |
| **manager** | GRP_Manager | CRUD en máquinas y hardware, solo lectura en usuarios |
| **technician** | GRP_Technician | Lectura y actualización de máquinas y hardware |
| **teacher** | GRP_Teacher | Solo lectura de inventario |
