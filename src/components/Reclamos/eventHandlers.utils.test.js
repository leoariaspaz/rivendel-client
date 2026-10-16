import { beforeEach, describe, expect, it, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import { Partes } from "../../api/repositories/partes.js";
import { Reclamos } from "../../api/repositories/reclamos.js";
import {
	handleChkComparecenciaChange,
	handleNroWhatsappChange,
	handleOnChange,
	handleSubmit,
	onAcceptSearchParte,
} from "./eventHandlers.utils.js";

vi.mock("../../api/repositories/partes.js", () => ({
	Partes: { get: vi.fn() },
}));

vi.mock("../../api/repositories/reclamos.js", () => ({
	Reclamos: { create: vi.fn(), update: vi.fn() },
}));

const baseState = {
	id: 12,
	numero: 42,
	fechaHoraInicio: "2026-03-15T10:00",
	horaFin: "11:00",
	idResolucion: 1,
	proxAudiencia: "",
	rubros: "Diferencias salariales",
	reclamantes: [],
	reclamados: [],
	clausulas: null,
	searchPartes: { show: true, esReclamante: true },
};

describe("reclamo event handlers", () => {
	beforeEach(() => vi.clearAllMocks());

	it.each([
		[{ target: { id: "numero", value: "A12B", type: "number" } }, "numero", 12],
		[{ target: { id: "multado", type: "checkbox", checked: true } }, "multado", true],
		[{ target: { id: "rubros", value: "Despido", type: "textarea" } }, "rubros", "Despido"],
	])("normaliza el cambio del campo %#", (event, field, value) => {
		const setField = vi.fn();

		handleOnChange(event, setField);

		expect(setField).toHaveBeenCalledWith(field, value);
	});

	it("envía el payload convertido al endpoint de actualización", async () => {
		Reclamos.update.mockResolvedValue({ ok: true });
		const callbacks = {
			setErrors: vi.fn(),
			submitStart: vi.fn(),
			submitSuccess: vi.fn(),
			submitFail: vi.fn(),
			navigate: vi.fn(),
		};

		await handleSubmit(
			{ preventDefault: vi.fn() },
			false,
			baseState,
			callbacks.setErrors,
			callbacks.submitStart,
			callbacks.submitSuccess,
			callbacks.submitFail,
			callbacks.navigate,
		);

		expect(Reclamos.update).toHaveBeenCalledWith(expect.objectContaining({
			id: 12,
			numero: 42,
			fechaHoraInicio: "2026-03-15T10:00:00-03:00",
			horaFin: "2026-03-15T11:00:00-03:00",
		}));
		expect(Reclamos.create).not.toHaveBeenCalled();
		expect(callbacks.navigate).toHaveBeenCalledWith("/reclamos", {
			state: { successMsg: "El reclamo Nº 42 se actualizó correctamente." },
		});
	});

	it("agrega una parte a la lista del rol activo y cierra el diálogo", async () => {
		const parte = { id: 3, nombre: "Ana López" };
		Partes.get.mockResolvedValue({ ok: true, data: parte });
		const setField = vi.fn();
		const hideDialog = vi.fn();

		onAcceptSearchParte({ preventDefault: vi.fn() }, parte, baseState, hideDialog, setField, vi.fn());

		await waitFor(() => expect(setField).toHaveBeenCalledWith("reclamantes", [parte]));
		expect(Partes.get).toHaveBeenCalledWith(3);
		expect(hideDialog).toHaveBeenCalledOnce();
	});

	it("evita agregar una parte duplicada", () => {
		const parte = { id: 3, nombre: "Ana López" };
		const hideDialog = vi.fn();

		onAcceptSearchParte(
			{ preventDefault: vi.fn() },
			parte,
			{ ...baseState, reclamantes: [parte] },
			hideDialog,
			vi.fn(),
			vi.fn(),
		);

		expect(Partes.get).not.toHaveBeenCalled();
		expect(hideDialog).toHaveBeenCalledOnce();
	});

	it("muestra el error HTTP si no puede cargar la parte seleccionada", async () => {
		Partes.get.mockResolvedValue({ ok: false, status: 404, error: "No existe" });
		const setErrors = vi.fn();

		onAcceptSearchParte(
			{ preventDefault: vi.fn() },
			{ id: 3 },
			baseState,
			vi.fn(),
			vi.fn(),
			setErrors,
		);

		await waitFor(() => expect(setErrors).toHaveBeenCalledWith([
			"Error 404 al obtener los datos de la parte seleccionada: No existe",
		]));
	});

	it.each([
		[true, "", 3, true, false],
		[false, null, 3, true, false],
	])("representa comparecencia checked=%s como %s", (checked, value, idParte, esPatrocinante, esReclamante) => {
		const onChange = vi.fn();

		handleChkComparecenciaChange(
			{ target: { checked } },
			{ onChange, idParte, esPatrocinante, esReclamante },
		);

		expect(onChange).toHaveBeenCalledWith(value, idParte, esPatrocinante, esReclamante);
	});

	it("conserva los datos de rol al cambiar el WhatsApp", () => {
		const onChange = vi.fn();

		handleNroWhatsappChange(
			{ target: { value: "5491112345678" } },
			{ onChange, idParte: 3, esPatrocinante: true, esReclamante: false },
		);

		expect(onChange).toHaveBeenCalledWith("5491112345678", 3, true, false);
	});
});