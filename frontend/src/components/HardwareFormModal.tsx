import { useEffect, useState, type FormEvent } from "react";
import type { Hardware, HardwareInput, HardwareType } from "../types";
import Modal from "./Modal";
import { validateHardwareInput } from "../utils/validation";
import { ZodError } from "zod";

interface HardwareFormModalProps {
	open: boolean;
	hardware?: Hardware | null;
	onClose: () => void;
	onSubmit: (input: HardwareInput) => Promise<void>;
}

const EMPTY_FORM: HardwareInput = {
	type: "desktop",
	manufacturer: "",
	model: "",
	cpu: "",
	ramGb: 8,
	diskGb: 256,
	os: "",
	monitor: "",
	mouse: "",
	keyboard: "",
};

export default function HardwareFormModal({ open, hardware, onClose, onSubmit }: HardwareFormModalProps) {
	const [form, setForm] = useState<HardwareInput>(EMPTY_FORM);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const isEdit = hardware != null;

	useEffect(() => {
		if (!open) return;

		// Use setTimeout to avoid synchronous setState in effect
		const timeoutId = setTimeout(() => {
			if (hardware) {
				setForm({
					type: hardware.type,
					manufacturer: hardware.manufacturer,
					model: hardware.model,
					cpu: hardware.cpu,
					ramGb: hardware.ramGb,
					diskGb: hardware.diskGb,
					os: hardware.os,
					monitor: hardware.monitor,
					mouse: hardware.mouse,
					keyboard: hardware.keyboard,
				});
			} else {
				setForm(EMPTY_FORM);
			}
			setError(null);
		}, 0);

		return () => clearTimeout(timeoutId);
	}, [open, hardware]);

	async function handleSubmit(event: FormEvent) {
		event.preventDefault();
		setIsSaving(true);
		setError(null);

		try {
			// Validate form data before submission
			validateHardwareInput(form);
			await onSubmit(form);
			onClose();
		} catch (err) {
			if (err instanceof ZodError) {
				// Format Zod validation errors for display
				const errorMessages = err.issues.map((e) => e.message).join(", ");
				setError(errorMessages);
			} else {
				setError(err instanceof Error ? err.message : "Error al guardar");
			}
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<Modal open={open} title={isEdit ? "Editar hardware" : "Agregar hardware"} onClose={onClose}>
			<form className="modal-form" onSubmit={handleSubmit}>
				<div className="form-grid">
					<label className="field">
						<span>Tipo</span>
						<select
							value={form.type}
							onChange={(e) =>
								setForm((prev) => ({
									...prev,
									type: e.target.value as HardwareType,
								}))
							}
							disabled={isSaving}
						>
							<option value="desktop">Desktop</option>
							<option value="laptop">Laptop</option>
						</select>
					</label>

					<label className="field">
						<span>Fabricante</span>
						<input
							value={form.manufacturer}
							onChange={(e) => setForm((prev) => ({ ...prev, manufacturer: e.target.value }))}
							required
							disabled={isSaving}
						/>
					</label>

					<label className="field">
						<span>Modelo</span>
						<input
							value={form.model}
							onChange={(e) => setForm((prev) => ({ ...prev, model: e.target.value }))}
							required
							disabled={isSaving}
						/>
					</label>

					<label className="field">
						<span>CPU</span>
						<input
							value={form.cpu}
							onChange={(e) => setForm((prev) => ({ ...prev, cpu: e.target.value }))}
							required
							disabled={isSaving}
						/>
					</label>

					<label className="field">
						<span>RAM (GB)</span>
						<input
							type="number"
							min={1}
							value={form.ramGb}
							onChange={(e) => setForm((prev) => ({ ...prev, ramGb: Number(e.target.value) }))}
							required
							disabled={isSaving}
						/>
					</label>

					<label className="field">
						<span>Disco (GB)</span>
						<input
							type="number"
							min={1}
							value={form.diskGb}
							onChange={(e) => setForm((prev) => ({ ...prev, diskGb: Number(e.target.value) }))}
							required
							disabled={isSaving}
						/>
					</label>

					<label className="field form-grid__wide">
						<span>Sistema operativo</span>
						<input
							value={form.os}
							onChange={(e) => setForm((prev) => ({ ...prev, os: e.target.value }))}
							required
							disabled={isSaving}
						/>
					</label>

					<label className="field">
						<span>Monitor</span>
						<input
							value={form.monitor}
							onChange={(e) => setForm((prev) => ({ ...prev, monitor: e.target.value }))}
							required
							disabled={isSaving}
						/>
					</label>

					<label className="field">
						<span>Mouse</span>
						<input
							value={form.mouse}
							onChange={(e) => setForm((prev) => ({ ...prev, mouse: e.target.value }))}
							required
							disabled={isSaving}
						/>
					</label>

					<label className="field">
						<span>Teclado</span>
						<input
							value={form.keyboard}
							onChange={(e) => setForm((prev) => ({ ...prev, keyboard: e.target.value }))}
							required
							disabled={isSaving}
						/>
					</label>
				</div>

				{error && <p className="form-error">{error}</p>}

				<div className="modal-actions">
					<button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSaving}>
						Cancelar
					</button>
					<button type="submit" className="btn btn-primary" disabled={isSaving}>
						{isSaving ? "Guardando…" : "Guardar"}
					</button>
				</div>
			</form>
		</Modal>
	);
}
