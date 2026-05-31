export type UserRole = "readonly" | "operator" | "editor" | "manager" | "sysadmin";

export interface User {
	id: string;
	username: string;
	displayName: string;
	role: UserRole;
	labs: string[];
}

export interface AuthPayload {
	user: User;
}

export interface AuthRequest {
	username: string;
	password: string;
}

export interface AuthResponse {
	token: string;
	user: User;
}

export type MachineStatus = "active" | "maintenance" | "retired";

export type AssigneeType = "student" | "teacher" | "technician";

export interface Machine {
	id: number;
	hostname: string;
	lab: string;
	benchNumber: number;
	maintenanceDate: string;
	status: MachineStatus;
	assignee?: string;
	assigneeType?: AssigneeType;
}

export type MachineInput = Omit<Machine, "id">;

export type HardwareType = "desktop" | "laptop";

export interface Hardware {
	machineId: number;
	type: HardwareType;
	manufacturer: string;
	model: string;
	cpu: string;
	ramGb: number;
	diskGb: number;
	os: string;
	monitor: string;
	mouse: string;
	keyboard: string;
}

export type HardwareInput = Omit<Hardware, "machineId">;

export interface AdUser {
	id: string;
	username: string;
	displayName: string;
	email: string;
	groups: string[];
	enabled: boolean;
}

export type AdUserInput = Omit<AdUser, "id"> & { password?: string };

export interface AuthenticatedRequest {
	user: User;
}

export interface ErrorResponse {
	error: string;
}

export type LabName = "Lab 101" | "Lab 102" | "Lab 201";
