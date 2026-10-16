import { describe, expect, it } from "vitest";
import { validateReclamo } from "./validators.js";
import { isValidHour } from "./dateUtils.js";
import { PENDIENTE } from "./tiposResoluciones.js";

const validState = {
	numero: 42,
	fechaHoraInicio: "2026-03-15T10:00",
	horaFin: "11:30",
	idResolucion: PENDIENTE,
	proxAudiencia: "",
};

describe("validateReclamo", () => {
	it("reconoce el formato válido HH:mm", () => {
		expect(isValidHour("11:30")).toBe(true);
	});

	it.each(["00:00", "23:59"])("acepta el límite válido %s", (hora) => {
		expect(isValidHour(hora)).toBe(true);
	});

	it.each(["24:00", "12:60", "1:30", "25:90", "11:30:00", ""])(
		"rechaza el formato inválido %s",
		(hora) => expect(isValidHour(hora)).toBe(false),
	);

	it("rechaza una hora de fin inválida", () => {
		expect(validateReclamo({ ...validState, horaFin: "25:90" })).toContain(
			"Ingrese una hora de fin válida",
		);
	});

	it("acepta una hora de fin válida", () => {
		expect(validateReclamo(validState)).not.toContain("Ingrese una hora de fin válida");
	});

	it("rechaza una hora de fin anterior a la hora de inicio", () => {
		expect(validateReclamo({ ...validState, horaFin: "09:30" })).toContain(
			"La hora de fin no puede ser anterior a la hora de inicio.",
		);
	});

	it("acepta una hora de fin posterior dentro del mismo día", () => {
		expect(validateReclamo({ ...validState, horaFin: "10:01" })).not.toContain(
			"La hora de fin no puede ser anterior a la hora de inicio.",
		);
	});
});