# Contribución

## Convención de commits

Se usa [Conventional Commits](https://www.conventionalcommits.org/).

```
<tipo>(<scope>): <descripción>
```

### Tipos

| Tipo | Uso |
|------|-----|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Solo documentación |
| `chore` | Build, config, herramientas |
| `refactor` | Cambio que no es fix ni feat |
| `test` | Agregar o corregir tests |
| `ci` | Cambios en GitHub Actions |

### Scopes

`frontend` · `backend` · `k8s` · `db` · `auth` · `docs`

### Ejemplos

```
feat(backend): agregar endpoint de búsqueda de activos
fix(frontend): corregir paginación en tabla de inventario
chore(k8s): actualizar límites de recursos del backend
ci: agregar paso de lint al workflow de PR
docs: agregar guía de convención de commits
```

### Reglas

- Descripción en minúsculas, sin punto final
- Usar el idioma del equipo (español)
- Un commit por cambio lógico
