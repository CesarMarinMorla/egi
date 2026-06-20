import { useEffect, useMemo, useState } from "react";
import MachineFormModal from "../components/MachineFormModal";
import MachineTable from "../components/MachineTable";
import { useAuth } from "../hooks/useAuth";
import { can, canAccessLab } from "../hooks/usePermissions";
import { createMachine, getAdUsers, getMachines } from "../services/api";
import { ALL_LABS, type AdUser, type Machine } from "../types";

export default function Dashboard() {
	const { user } = useAuth();
	const [machines, setMachines] = useState<Machine[]>([]);
	const [users, setUsers] = useState<AdUser[]>([]);
	const [labFilter, setLabFilter] = useState("all");
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [createModalOpen, setCreateModalOpen] = useState(false);

	useEffect(() => {
		let cancelled = false;

		async function load() {
			setIsLoading(true);
			setError(null);

			try {
				const [data, usersData] = await Promise.allSettled([getMachines(), getAdUsers()]);
				if (!cancelled) {
					if (data.status === "fulfilled") setMachines(data.value);
                                        if (usersData.status === "fulfilled") setUsers(usersData.value);
				}
			} catch (err) {
				if (!cancelled) {
					setError(err instanceof Error ? err.message : "Error al cargar máquinas");
				}
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		}

		load();

		return () => {
			cancelled = true;
		};
	}, []);

	const scopedMachines = useMemo(() => {
		if (!user) return [];
		return machines.filter((machine) => canAccessLab(user, machine.lab));
	}, [machines, user]);

	const availableLabs = useMemo(() => {
		const labs = new Set(scopedMachines.map((machine) => machine.lab));
		return [...labs].sort();
	}, [scopedMachines]);

	const filteredMachines = useMemo(() => {
		if (labFilter === "all") return scopedMachines;
		return scopedMachines.filter((machine) => machine.lab === labFilter);
	}, [scopedMachines, labFilter]);

	const createLabs = useMemo(() => {
		if (!user) return [];
		if (user.role === "sysadmin" || user.role === "manager") {
			return [...ALL_LABS];
		}
		return user.labs;
	}, [user]);

	const canCreate = user ? can(user, "create", "inventory") : false;

	async function handleCreate(input: Parameters<typeof createMachine>[0]) {
		if (!user || !canAccessLab(user, input.lab)) {
			throw new Error("No tenés permiso para crear en ese laboratorio");
		}

		const created = await createMachine(input);
		setMachines((prev) => [...prev, created]);
	}

	return (
		<section className="page">
			<header className="page-header page-header--row">
				<div>
					<h1>Inventario</h1>
					<p className="muted">
						{scopedMachines.length} máquina
						{scopedMachines.length !== 1 ? "s" : ""} en tu alcance
					</p>
				</div>

				{canCreate && createLabs.length > 0 && (
					<button type="button" className="btn btn-primary" onClick={() => setCreateModalOpen(true)}>
						Nueva máquina
					</button>
				)}
			</header>

			<div className="toolbar">
				<label className="field field--inline">
					<span>Laboratorio</span>
					<select
						value={labFilter}
						onChange={(e) => setLabFilter(e.target.value)}
						disabled={isLoading || availableLabs.length === 0}
					>
						<option value="all">Todos</option>
						{availableLabs.map((lab) => (
							<option key={lab} value={lab}>
								{lab}
							</option>
						))}
					</select>
				</label>
			</div>

			{error && <p className="form-error">{error}</p>}

			{isLoading ? <p className="muted">Cargando inventario…</p> : <MachineTable machines={filteredMachines} />}

			<MachineFormModal
				open={createModalOpen}
				labs={createLabs}
				users={users}
				onClose={() => setCreateModalOpen(false)}
				onSubmit={handleCreate}
			/>
		</section>
	);
}
