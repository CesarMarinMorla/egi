import { z } from "zod";
import type { HardwareInput, MachineInput, AdUserInput, AdGroup } from "../types";

// Common validation patterns
const safeString = z
	.string()
	.min(1, "Este campo es requerido")
	.max(255, "Máximo 255 caracteres")
	.refine((val) => val.trim() === val || true, "Este campo no debe tener espacios al inicio o final");

// Hardware validation
export const hardwareInputSchema = z.object({
	type: z.enum(["desktop", "laptop"]),
	manufacturer: safeString,
	model: safeString,
	cpu: safeString,
	ramGb: z
		.number()
		.int("RAM debe ser un número entero")
		.min(1, "RAM debe ser al menos 1 GB")
		.max(128, "RAM no puede exceder 128 GB"),
	diskGb: z
		.number()
		.int("Disco debe ser un número entero")
		.min(1, "Disco debe ser al menos 1 GB")
		.max(10240, "Disco no puede exceder 10240 GB (10 TB)"),
	os: safeString,
	monitor: safeString,
	mouse: safeString,
	keyboard: safeString,
});

// Machine validation
const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
export const machineInputSchema = z.object({
	hostname: z
		.string()
		.min(1, "Hostname es requerido")
		.max(63, "Hostname no puede exceder 63 caracteres")
		.regex(hostnameRegex, "Hostname inválido. Solo letras, números y guiones")
		.refine((val) => val.trim() === val || true, "Hostname no debe tener espacios al inicio o final"),
	lab: z.string().min(1, "Laboratorio es requerido"),
	benchNumber: z
		.number()
		.int("Número de banco debe ser un entero")
		.min(1, "Número de banco debe ser al menos 1")
		.max(100, "Número de banco no puede exceder 100"),
	maintenanceDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)")
		.refine((date) => {
			const parsed = new Date(date);
			const now = new Date();
			return !isNaN(parsed.getTime()) && parsed <= now;
		}, "La fecha de mantenimiento no puede ser futura"),
	status: z.enum(["active", "maintenance", "retired"]),
	assignee: z
		.string()
		.max(100, "Asignado a no puede exceder 100 caracteres")
		.refine((val) => !val || val.trim() === val || true, "Asignado a no debe tener espacios al inicio o final")
		.optional(),
	assigneeType: z.enum(["student", "teacher", "technician"]).optional(),
});

// AD User validation
const usernameRegex = /^[a-zA-Z0-9._-]{3,20}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const adUserInputSchema = z.object({
	username: z
		.string()
		.min(3, "Usuario debe tener al menos 3 caracteres")
		.max(20, "Usuario no puede exceder 20 caracteres")
		.regex(usernameRegex, "Usuario inválido. Solo letras, números, puntos, guiones y guiones bajos")
		.refine((val) => val.trim() === val || true, "Usuario no debe tener espacios al inicio o final"),
	displayName: z
		.string()
		.min(2, "Nombre debe tener al menos 2 caracteres")
		.max(100, "Nombre no puede exceder 100 caracteres")
		.refine((val) => val.trim() === val || true, "Nombre no debe tener espacios al inicio o final"),
	email: z
		.string()
		.min(1, "Email es requerido")
		.max(255, "Email no puede exceder 255 caracteres")
		.regex(emailRegex, "Email inválido")
		.refine((val) => val.trim() === val || true, "Email no debe tener espacios al inicio o final"),
	groups: z
		.array(
			z.custom<AdGroup>((val) => {
				const validGroups: AdGroup[] = ["GRP_Sysadmin", "GRP_Manager", "GRP_Editor", "GRP_Operator", "GRP_ReadOnly"];
				return validGroups.includes(val as AdGroup);
			}, "Grupo inválido"),
		)
		.min(1, "Debe seleccionar al menos un grupo")
		.max(5, "No puede seleccionar más de 5 grupos"),
	enabled: z.boolean(),
});

// URL parameter validation
export const machineIdSchema = z
	.string()
	.refine((val) => {
		const num = parseInt(val, 10);
		return !isNaN(num) && num > 0 && num <= 999999;
	}, "ID debe ser un número positivo entre 1 y 999999")
	.transform((val) => parseInt(val, 10));

// LocalStorage validation
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

// Validation functions
export function validateHardwareInput(data: unknown): HardwareInput {
	return hardwareInputSchema.parse(data);
}

export function validateMachineInput(data: unknown): MachineInput {
	return machineInputSchema.parse(data);
}

export function validateAdUserInput(data: unknown): AdUserInput {
	return adUserInputSchema.parse(data);
}

export function validateMachineId(id: string): number {
	return machineIdSchema.parse(id);
}

export function validateAuthSession(data: unknown): z.infer<typeof authSessionSchema> {
	return authSessionSchema.parse(data);
}

// Safe parsing functions (return null instead of throwing)
export function safeValidateHardwareInput(data: unknown): HardwareInput | null {
	const result = hardwareInputSchema.safeParse(data);
	return result.success ? result.data : null;
}

export function safeValidateMachineInput(data: unknown): MachineInput | null {
	const result = machineInputSchema.safeParse(data);
	return result.success ? result.data : null;
}

export function safeValidateAdUserInput(data: unknown): AdUserInput | null {
	const result = adUserInputSchema.safeParse(data);
	return result.success ? result.data : null;
}

export function safeValidateAuthSession(data: unknown): z.infer<typeof authSessionSchema> | null {
	const result = authSessionSchema.safeParse(data);
	return result.success ? result.data : null;
}

// XSS sanitization utility
export function sanitizeInput(input: string): string {
	return input
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#x27;")
		.replace(/\//g, "&#x2F;");
}
