# Validación de entrada — Frontend

## Resumen

Se implementó validación robusta de entrada en el frontend usando schemas de Zod y sanitización XSS. Este documento detalla todos los cambios realizados para agregar validación del lado del cliente a la aplicación.

## Cambios realizados

### 1. Archivo central de validación

**Archivo:** `frontend/src/utils/validation.ts`

**Propósito:** Lógica de validación centralizada con schemas de Zod

**Características:**
- Schemas Zod para todos los tipos de entrada (`HardwareInput`, `MachineInput`, `AdUserInput`)
- Validación de parámetros URL para IDs de máquinas
- Validación de sesión en `localStorage`
- Función de sanitización XSS
- Funciones de validación tanto lanzando excepción como con safe-parse

**Schemas principales:**

#### Schema de Hardware
```typescript
export const hardwareInputSchema = z.object({
 type: z.enum(["desktop", "laptop"]),
 manufacturer: safeString,
 model: safeString,
 cpu: safeString,
 ramGb: z.number().int().min(1).max(128),
 diskGb: z.number().int().min(1).max(10240),
 os: safeString,
 monitor: safeString,
 mouse: safeString,
 keyboard: safeString,
});
```

#### Schema de Máquina
```typescript
export const machineInputSchema = z.object({
 hostname: z.string()
.min(1, "Hostname es requerido")
.max(63, "Hostname no puede exceder 63 caracteres")
.regex(hostnameRegex, "Hostname inválido. Solo letras, números y guiones"),
 lab: z.string().min(1, "Laboratorio es requerido"),
 benchNumber: z.number().int().min(1).max(100),
 maintenanceDate: z.string()
.regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)")
.refine((date) => {
 const parsed = new Date(date);
 return !isNaN(parsed.getTime()) && parsed <= new Date();
 }, "La fecha de mantenimiento no puede ser futura"),
 status: z.enum(["active", "maintenance", "retired"]),
 assignee: z.string().max(100).optional(),
 assigneeType: z.enum(["student", "teacher", "technician"]).optional(),
});
```

#### Schema de Usuario AD
```typescript
export const adUserInputSchema = z.object({
 username: z.string()
.min(3, "Usuario debe tener al menos 3 caracteres")
.max(20, "Usuario no puede exceder 20 caracteres")
.regex(usernameRegex, "Usuario inválido. Solo letras, números, puntos, guiones y guiones bajos"),
 displayName: z.string()
.min(2, "Nombre debe tener al menos 2 caracteres")
.max(100, "Nombre no puede exceder 100 caracteres"),
 email: z.string()
.min(1, "Email es requerido")
.max(255, "Email no puede exceder 255 caracteres")
.regex(emailRegex, "Email inválido"),
 groups: z.array(z.custom<AdGroup>((val) => {
 const validGroups = ["GRP_Sysadmin", "GRP_Manager",
 "GRP_Editor_Lab101", "GRP_Editor_Lab102", "GRP_Editor_Lab201",
 "GRP_Operator_Lab101", "GRP_Operator_Lab102", "GRP_Operator_Lab201",
 "GRP_ReadOnly_Lab101", "GRP_ReadOnly_Lab102", "GRP_ReadOnly_Lab201"];
 const valStr = String(val);
 const groupName = valStr.includes(",") ? valStr.split(",")[0].replace("CN=", ""): valStr;
 return validGroups.includes(groupName);
 }, "Grupo inválido"))
.min(1, "Debe seleccionar al menos un grupo")
.max(5, "No puede seleccionar más de 5 grupos"),
 enabled: z.boolean(),
});
```

> Los grupos se cambiaron a variantes por laboratorio (`GRP_Editor_Lab101`, etc.). El validador también acepta grupos en formato `CN=GRP_...,OU=EGI,...` provenientes de LDAP.

#### Validación de parámetro URL
```typescript
export const machineIdSchema = z.string()
.refine((val) => {
 const num = parseInt(val, 10);
 return !isNaN(num) && num > 0 && num <= 999999;
 }, "ID debe ser un número positivo entre 1 y 999999")
.transform((val) => parseInt(val, 10));
```

#### Validación de sesión en localStorage
```typescript
const authSessionSchema = z.object({
 token: z.string().min(1),
 user: z.object({
 id: z.string().min(1),
 username: z.string().min(1),
 displayName: z.string().min(1),
 role: z.enum(["sysadmin", "manager", "editor", "operator", "readonly"]),
 labs: z.array(z.string()),
 }),
});
```

#### Sanitización XSS
```typescript
export function sanitizeInput(input: string): string {
 return input
.replace(/&/g, "&amp;")
.replace(/</g, "&lt;")
.replace(/>/g, "&gt;")
.replace(/"/g, "&quot;")
.replace(/'/g, "&#x27;")
.replace(/\//g, "&#x2F;");
}
```

---

### 2. Validación en formularios

La misma lógica se aplica en los tres modales. Ejemplo con `HardwareFormModal`:

```typescript
async function handleSubmit(event: FormEvent) {
 event.preventDefault();
 setIsSaving(true);
 setError(null);

 try {
 validateHardwareInput(form);
 await onSubmit(form);
 onClose();
 } catch (err) {
 if (err instanceof ZodError) {
 setError(err.issues.map((e) => e.message).join(", "));
 } else {
 setError(err instanceof Error ? err.message: "Error al guardar");
 }
 } finally {
 setIsSaving(false);
 }
}
```

**Archivos modificados:** `HardwareFormModal.tsx`, `MachineFormModal.tsx`, `UserFormModal.tsx`

---

### 3. Validación de parámetro URL en MachineDetail

```typescript
let machineId: number;
try {
 machineId = id ? validateMachineId(id): NaN;
} catch {
 machineId = NaN;
}
```

---

### 4. Validación de localStorage

**`services/http.ts`** — valida el token antes de usarlo:
```typescript
export function getStoredToken(): string | null {
 const raw = localStorage.getItem(STORAGE_KEY);
 if (!raw) return null;
 try {
 const session = safeValidateAuthSession(JSON.parse(raw));
 return session?.token ?? null;
 } catch {
 return null;
 }
}
```

**`utils/authStorage.ts`** — valida la sesión completa, limpia datos inválidos:
```typescript
function readStoredSession(): AuthSession | null {
 const raw = localStorage.getItem(STORAGE_KEY);
 if (!raw) return null;
 try {
 const session = safeValidateAuthSession(JSON.parse(raw));
 return session;
 } catch {
 localStorage.removeItem(STORAGE_KEY);
 return null;
 }
}
```

---

## Cobertura

| Componente | Tipo de validación | Estado |
|---|---|---|
| `HardwareFormModal` | Formulario | |
| `MachineFormModal` | Formulario | |
| `UserFormModal` | Formulario | |
| `MachineDetail` | Parámetro URL | |
| `http.ts` | Token en localStorage | |
| `utils/authStorage.ts` | Sesión en localStorage | |
| Protección XSS | Sanitización + schemas | |

## Notas

- La validación del formulario de login fue excluida intencionalmente para no dificultar las pruebas.
- Toda la validación es del lado del cliente. El backend también debe validar (ver `docs/seguridad.md`).
- El `sanitizeInput` hace encoding de entidades HTML, apropiado para renderizado en el DOM.
