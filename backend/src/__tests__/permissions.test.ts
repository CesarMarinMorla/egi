import { can, canAccessLab } from "../lib/permissions.js";
import type { User } from "../types/index.js";

describe("Permissions", () => {
	const createMockUser = (role: User["role"], labs: string[] = []): User => ({
		id: "test-id",
		username: "test-user",
		displayName: "Test User",
		role,
		labs,
	});

	describe("can", () => {
		it("should allow sysadmin all permissions", () => {
			const sysadmin = createMockUser("sysadmin");
			expect(can(sysadmin, "read", "inventory")).toBe(true);
			expect(can(sysadmin, "create", "inventory")).toBe(true);
			expect(can(sysadmin, "update", "inventory")).toBe(true);
			expect(can(sysadmin, "delete", "inventory")).toBe(true);
			expect(can(sysadmin, "read", "users")).toBe(true);
			expect(can(sysadmin, "create", "users")).toBe(true);
			expect(can(sysadmin, "update", "users")).toBe(true);
			expect(can(sysadmin, "delete", "users")).toBe(true);
		});

		it("should allow manager inventory CRUD but only read users", () => {
			const manager = createMockUser("manager");
			expect(can(manager, "read", "inventory")).toBe(true);
			expect(can(manager, "create", "inventory")).toBe(true);
			expect(can(manager, "update", "inventory")).toBe(true);
			expect(can(manager, "delete", "inventory")).toBe(true);
			expect(can(manager, "read", "users")).toBe(true);
			expect(can(manager, "create", "users")).toBe(false);
			expect(can(manager, "update", "users")).toBe(false);
			expect(can(manager, "delete", "users")).toBe(false);
		});

		it("should allow editor inventory CRUD but no user permissions", () => {
			const editor = createMockUser("editor");
			expect(can(editor, "read", "inventory")).toBe(true);
			expect(can(editor, "create", "inventory")).toBe(true);
			expect(can(editor, "update", "inventory")).toBe(true);
			expect(can(editor, "delete", "inventory")).toBe(false);
			expect(can(editor, "read", "users")).toBe(false);
			expect(can(editor, "create", "users")).toBe(false);
			expect(can(editor, "update", "users")).toBe(false);
			expect(can(editor, "delete", "users")).toBe(false);
		});

		it("should allow operator read and update inventory", () => {
			const operator = createMockUser("operator");
			expect(can(operator, "read", "inventory")).toBe(true);
			expect(can(operator, "create", "inventory")).toBe(false);
			expect(can(operator, "update", "inventory")).toBe(true);
			expect(can(operator, "delete", "inventory")).toBe(false);
			expect(can(operator, "read", "users")).toBe(false);
			expect(can(operator, "create", "users")).toBe(false);
			expect(can(operator, "update", "users")).toBe(false);
			expect(can(operator, "delete", "users")).toBe(false);
		});

		it("should only allow readonly to read inventory", () => {
			const readonly = createMockUser("readonly");
			expect(can(readonly, "read", "inventory")).toBe(true);
			expect(can(readonly, "create", "inventory")).toBe(false);
			expect(can(readonly, "update", "inventory")).toBe(false);
			expect(can(readonly, "delete", "inventory")).toBe(false);
			expect(can(readonly, "read", "users")).toBe(false);
			expect(can(readonly, "create", "users")).toBe(false);
			expect(can(readonly, "update", "users")).toBe(false);
			expect(can(readonly, "delete", "users")).toBe(false);
		});

		it("should return false for undefined user", () => {
			expect(can(undefined, "read", "inventory")).toBe(false);
			expect(can(null, "read", "inventory")).toBe(false);
		});
	});

	describe("canAccessLab", () => {
		it("should allow sysadmin to access any lab", () => {
			const sysadmin = createMockUser("sysadmin");
			expect(canAccessLab(sysadmin, "Lab 101")).toBe(true);
			expect(canAccessLab(sysadmin, "Lab 102")).toBe(true);
			expect(canAccessLab(sysadmin, "Lab 201")).toBe(true);
		});

		it("should allow manager to access any lab", () => {
			const manager = createMockUser("manager");
			expect(canAccessLab(manager, "Lab 101")).toBe(true);
			expect(canAccessLab(manager, "Lab 102")).toBe(true);
			expect(canAccessLab(manager, "Lab 201")).toBe(true);
		});

		it("should allow editor to access only their assigned labs", () => {
			const editor = createMockUser("editor", ["Lab 101", "Lab 102"]);
			expect(canAccessLab(editor, "Lab 101")).toBe(true);
			expect(canAccessLab(editor, "Lab 102")).toBe(true);
			expect(canAccessLab(editor, "Lab 201")).toBe(false);
		});

		it("should allow operator to access only their assigned labs", () => {
			const operator = createMockUser("operator", ["Lab 101"]);
			expect(canAccessLab(operator, "Lab 101")).toBe(true);
			expect(canAccessLab(operator, "Lab 102")).toBe(false);
			expect(canAccessLab(operator, "Lab 201")).toBe(false);
		});

		it("should allow readonly to access only their assigned labs", () => {
			const readonly = createMockUser("readonly", ["Lab 201"]);
			expect(canAccessLab(readonly, "Lab 201")).toBe(true);
			expect(canAccessLab(readonly, "Lab 101")).toBe(false);
			expect(canAccessLab(readonly, "Lab 102")).toBe(false);
		});

		it("should return false for undefined user", () => {
			expect(canAccessLab(undefined, "Lab 101")).toBe(false);
			expect(canAccessLab(null, "Lab 101")).toBe(false);
		});
	});
});
