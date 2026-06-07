# Pendientes — Puesta en marcha

Pasos a completar en orden para tener el sistema funcionando en producción.

## Orden de ejecución

| # | Tarea | Archivo | Estado |
|---|---|---|---|
| 1 | Configurar SQL Server | [sql-server.md](./sql-server.md) | ⬜ Pendiente |
| 2 | Configurar Active Directory | [active-directory.md](./active-directory.md) | ⬜ Pendiente |
| 3 | Crear VM Linux y desplegar Minikube | [vm-linux.md](./vm-linux.md) | ⬜ Pendiente |
| 4 | Configurar port forward en pfSense | [pfsense.md](./pfsense.md) | ⬜ Pendiente |

## Información pendiente de confirmar

- [ ] Dominio AD exacto (se asume `itu.local` — verificar)
- [ ] Atributo de login LDAP: `sAMAccountName` o `userPrincipalName`
- [ ] Usuario de servicio para bind LDAP (nombre y password)
- [ ] Si el examen requiere HTTPS — ver nota en `docs/pfsense-portforward.md`

## Referencias

- Arquitectura completa: [`docs/despliegue/produccion.md`](../despliegue/produccion.md)
- Port forwards detallados: [`docs/despliegue/pfsense-portforward.md`](../despliegue/pfsense-portforward.md)
- Manifiestos K8s: `k8s/`
- Workflow CI/CD: `.github/workflows/deploy.yml`
