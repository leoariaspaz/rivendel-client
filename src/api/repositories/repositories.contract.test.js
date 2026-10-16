import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../../../test/msw/server.js";
import { Partes } from "./partes.js";
import { Patrocinantes } from "./patrocinantes.js";
import { Reclamos } from "./reclamos.js";

const partePayload = {
	nombre: "Ana López",
	idTipoDocumento: 1,
	nroDocumento: "123",
	cuil: "20123456789",
	domicilio: "Calle 1",
	idPatrocinante: 8,
	esApoderado: false,
	localidad: "Rosario",
};

const patrocinantePayload = {
	nombre: "Dra. Ana López",
	nroMatricula: "MP-123",
	domicilio: "Calle 1",
	localidad: "Rosario",
	nroCasillero: "42",
};

const reclamoPayload = {
	numero: 42,
	rubros: "Diferencias salariales",
	idResolucion: 1,
	fechaHoraInicio: "2026-03-15T10:00:00-03:00",
	pospuesto: false,
	horaFin: "2026-03-15T11:00:00-03:00",
	proximaAudiencia: null,
	reclamantes: [],
	reclamados: [],
	clausulas: null,
};

const cases = [
	{
		name: "Reclamos",
		repository: Reclamos,
		resource: "reclamos",
		payload: reclamoPayload,
		updatePayload: Object.fromEntries(Object.entries(reclamoPayload).filter(([key]) => key !== "pospuesto")),
		findAllSearch: "?query=despido&page=2&limit=7",
	},
	{
		name: "Partes",
		repository: Partes,
		resource: "partes",
		payload: partePayload,
		updatePayload: partePayload,
		findAllSearch: "?page=2&limit=7&query=despido",
	},
	{
		name: "Patrocinantes",
		repository: Patrocinantes,
		resource: "patrocinantes",
		payload: patrocinantePayload,
		updatePayload: patrocinantePayload,
		findAllSearch: "?query=despido&page=2&limit=7",
	},
];

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe.each(cases)("$name repository HTTP contract", ({ repository, resource, payload, updatePayload, findAllSearch }) => {
	const capture = () => {
		let capturedRequest;
		server.use(
			http.all(new RegExp(`/${resource}(?:/.*)?$`), async ({ request }) => {
				const url = new URL(request.url);
				capturedRequest = {
					method: request.method,
					pathname: url.pathname,
					search: url.search,
					body: request.method === "GET" || request.method === "DELETE" ? null : await request.json(),
				};
				return HttpResponse.json({ id: 9, data: [{ id: 9 }], totalRecords: 31 });
			}),
		);
		return () => capturedRequest;
	};

	it("configura GET by id y DELETE en la ruta del recurso", async () => {
		let request = capture();
		await repository.get(9);
		expect(request()).toMatchObject({ method: "GET", pathname: `/${resource}/9` });

		request = capture();
		await repository.delete(9);
		expect(request()).toMatchObject({ method: "DELETE", pathname: `/${resource}/9` });
	});

	it("envía POST y PATCH con el payload del recurso", async () => {
		let request = capture();
		await repository.create(payload);
		expect(request()).toMatchObject({
			method: "POST",
			pathname: `/${resource}`,
			body: payload,
		});

		request = capture();
		await repository.update({ id: 9, ...payload });
		expect(request()).toMatchObject({
			method: "PATCH",
			pathname: `/${resource}/9`,
			body: updatePayload,
		});
	});

	it("aplica query y paginación configuradas para el recurso", async () => {
		const request = capture();
		await repository.findAll({ query: "despido", currentPage: 2, recordsPerPage: 7 });

		expect(request()).toMatchObject({
			method: "GET",
			pathname: `/${resource}`,
			search: findAllSearch,
		});
	});

	it("aplica el límite de página por defecto", async () => {
		const request = capture();
		await repository.findAll({ currentPage: 1 });

		expect(request()).toMatchObject({
			method: "GET",
			pathname: `/${resource}`,
		});
		expect(new URLSearchParams(request().search).get("limit")).toBe("15");
	});
});