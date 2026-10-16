import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Reclamos } from "../../../api/repositories/reclamos.js";
import useReclamoForm from "./useReclamoForm.js";
import { ACUERDO, PENDIENTE } from "../tiposResoluciones.js";

vi.mock("../../../api/repositories/reclamos.js", () => ({
	Reclamos: { get: vi.fn() },
}));

describe("useReclamoForm", () => {
	beforeEach(() => vi.clearAllMocks());

	it("inicializa un formulario nuevo sin solicitar un reclamo", async () => {
		const { result } = renderHook(() => useReclamoForm());

		await waitFor(() => expect(result.current.state.id).toBe(0));
		expect(result.current.state.numero).toBe(0);
		expect(result.current.state.reclamantes).toEqual([]);
		expect(Reclamos.get).not.toHaveBeenCalled();
	});

	it("carga y mapea una edición", async () => {
		Reclamos.get.mockResolvedValue({
			ok: true,
			data: {
				id: 7,
				numero: 92,
				rubros: "Diferencias",
				idResolucion: ACUERDO,
				fechaHoraInicio: "2026-03-15T10:00:00-03:00",
				horaFin: "2026-03-15T11:30:00-03:00",
				proximaAudiencia: null,
				clausulas: { type: "doc" },
				reclamantes: [{ id: 1, nombre: "Ana" }],
				reclamados: [{ id: 2, nombre: "Empresa" }],
			},
		});

		const { result } = renderHook(({ id }) => useReclamoForm(id), { initialProps: { id: 7 } });

		await waitFor(() => expect(result.current.state.initializing).toBe(false));
		expect(Reclamos.get).toHaveBeenCalledWith(7);
		expect(result.current.state).toMatchObject({
			id: 7,
			numero: 92,
			rubros: "Diferencias",
			idResolucion: ACUERDO,
			fechaHoraInicio: "2026-03-15T10:00",
			horaFin: "11:30",
			isUpdate: true,
		});
	});

	it("expone errores de una carga fallida", async () => {
		Reclamos.get.mockResolvedValue({ ok: false, error: "No autorizado" });
		const { result } = renderHook(() => useReclamoForm(7));

		await waitFor(() => expect(result.current.state.initializing).toBe(false));
		expect(result.current.state.errors).toEqual(["No autorizado"]);
		expect(result.current.state.isUpdate).toBe(false);
	});

	it("aplica las acciones del formulario y cierra el diálogo conservando el rol", () => {
		const { result } = renderHook(() => useReclamoForm("new"));

		act(() => {
			result.current.setField("numero", 42);
			result.current.setErrors(["Error de validación"]);
			result.current.showSearchParteDialog(false);
		});
		expect(result.current.state).toMatchObject({
			numero: 42,
			errors: ["Error de validación"],
			searchPartes: { show: true, esReclamante: false },
		});

		act(() => result.current.hideSearchParteDialog());
		expect(result.current.state.searchPartes).toMatchObject({ show: false });
		expect(result.current.state.searchPartes.esReclamante).toBeUndefined();

		act(() => {
			result.current.submitStart();
			result.current.submitFail("Backend no disponible");
		});
		expect(result.current.state).toMatchObject({ loading: false, errors: ["Backend no disponible"] });

		act(() => result.current.submitSuccess());
		expect(result.current.state.numero).toBe(0);
	});

	it("deriva los datos de las primeras partes para el documento", async () => {
		const { result } = renderHook(() => useReclamoForm("new"));
		const reclamante = { nombre: "Ana", cuil: "20123456789", nroDocumento: "123" };
		const reclamado = { nombre: "Empresa SA", cuil: "0", nroDocumento: "456" };

		act(() => {
			result.current.setField("reclamantes", [reclamante]);
			result.current.setField("reclamados", [reclamado]);
			result.current.setField("rubros", "Indemnización");
		});

		await waitFor(() => expect(result.current.state.reclamo).toEqual({
			reclamante: { dni: "20123456789", nombre: "Ana" },
			reclamado: "456 - Empresa SA",
			rubros: "Indemnización",
		}));
	});

	it("vuelve a cargar cuando cambia el id de edición", async () => {
		Reclamos.get
			.mockResolvedValueOnce({ ok: true, data: { id: 7, numero: 70, idResolucion: PENDIENTE } })
			.mockResolvedValueOnce({ ok: true, data: { id: 8, numero: 80, idResolucion: PENDIENTE } });
		const { result, rerender } = renderHook(({ id }) => useReclamoForm(id), { initialProps: { id: 7 } });

		await waitFor(() => expect(result.current.state.numero).toBe(70));
		rerender({ id: 8 });
		await waitFor(() => expect(result.current.state.numero).toBe(80));
		expect(Reclamos.get).toHaveBeenNthCalledWith(2, 8);
	});
});