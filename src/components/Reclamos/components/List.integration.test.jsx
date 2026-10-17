import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { axe } from "vitest-axe";
import { NotificationContext } from "../../../contexts/Constants.jsx";
import { server } from "../../../../test/msw/server.js";
import ListReclamos from "./List.jsx";
import { RECLAMADO, RECLAMANTE } from "../../Shared/constants.js";

const searchPlaceholder = "Número o fecha de reclamo, nombre de una parte o fecha";
const showSuccess = () => {};
const showError = () => {};
const reclamo = {
	id: 5,
	numero: 42,
	fechaHoraInicio: "2026-03-15T10:00:00",
	horaFin: "2026-03-15T11:00:00",
	proximaAudiencia: null,
	idResolucion: 1,
	partes: [
		{ rol: RECLAMANTE, parte: { nombre: "Ana López" } },
		{ rol: RECLAMADO, parte: { nombre: "Empresa SA" } },
	],
};

const installSearchHandler = (requests = []) => {
	server.use(
		http.get(/\/reclamos(?:\?.*)?$/, ({ request }) => {
			requests.push(new URL(request.url));
			return HttpResponse.json({ totalRecords: 1, data: [reclamo] });
		}),
	);
};

const renderList = () => render(
	<NotificationContext.Provider value={{ showSuccess, showError }}>
		<MemoryRouter initialEntries={["/reclamos"]}>
			<ListReclamos />
		</MemoryRouter>
	</NotificationContext.Provider>,
);

describe("reclamos list integration", () => {
	beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
	afterEach(() => server.resetHandlers());
	afterAll(() => server.close());

	it("busca en el backend y muestra el reclamo devuelto", async () => {
		const requests = [];
		installSearchHandler(requests);

		const user = userEvent.setup();
		renderList();

		const search = screen.getByRole("textbox", { name: searchPlaceholder });
		await user.type(search, "Empresa");

		await waitFor(() => {
			expect(requests.some((url) => url.search === "?query=Empresa&page=1&limit=15")).toBe(true);
		});
		expect(await screen.findByText("Ana López")).toBeInTheDocument();
		expect(screen.getByText("Empresa SA")).toBeInTheDocument();
		expect(screen.getByText(/Nº\s*42/)).toBeInTheDocument();
	});

	it("no presenta violaciones axe en la jerarquía de encabezados", async () => {
		installSearchHandler();
		const { container } = renderList();

		await screen.findByText("Ana López");
		expect(await axe(container)).toHaveNoViolations();
	});
});