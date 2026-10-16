import { describe, expect, it } from "vitest";
import { initialState, reducer } from "./reducer.js";

describe("reclamo reducer", () => {
	it("actualiza un campo y limpia los errores anteriores", () => {
		const state = { ...initialState, errors: ["Anterior"] };

		expect(reducer(state, { type: "SET_FIELD", field: "numero", value: 42 })).toMatchObject({
			numero: 42,
			errors: [],
		});
	});

	it("reemplaza errores de validación", () => {
		expect(reducer(initialState, { type: "SET_ERRORS", errors: ["Número inválido"] }).errors)
			.toEqual(["Número inválido"]);
	});

	it("inicia el guardado limpiando errores", () => {
		const state = reducer(
			{ ...initialState, errors: ["Anterior"] },
			{ type: "SUBMIT_START" },
		);

		expect(state).toMatchObject({ loading: true, errors: [] });
	});

	it.each([
		["Error del servidor", ["Error del servidor"]],
		["", ["Error en la solicitud"]],
		[undefined, ["Error en la solicitud"]],
		[["Error A", "Error B"], ["Error A", "Error B"]],
	])("normaliza SUBMIT_FAIL para %s", (errors, expected) => {
		const state = reducer({ ...initialState, loading: true }, { type: "SUBMIT_FAIL", errors });

		expect(state).toMatchObject({ loading: false, errors: expected });
	});

	it("reinicia el formulario después de guardar", () => {
		const state = reducer({ ...initialState, numero: 42, loading: true }, { type: "SUBMIT_SUCCESS" });

		expect(state).toEqual(initialState);
	});

	it.each([
		[true, true],
		[false, false],
	])("selecciona el rol reclamante=%s para el diálogo", (esReclamante, expected) => {
		const state = reducer(initialState, {
			type: "SEARCH_PARTES",
			show: true,
			esReclamante,
		});

		expect(state.searchPartes).toEqual({ show: true, esReclamante: expected });
	});

	it.each([
		[{ id: 7, numero: 55 }, true],
		[{ numero: 55 }, false],
	])("marca carga inicial con isUpdate=%s", (payload, isUpdate) => {
		const state = reducer(initialState, { type: "INITIAL_LOAD", payload });

		expect(state).toMatchObject({ ...payload, initializing: false, isUpdate });
	});

	it("conserva la misma referencia para una acción desconocida", () => {
		expect(reducer(initialState, { type: "UNKNOWN" })).toBe(initialState);
	});
});