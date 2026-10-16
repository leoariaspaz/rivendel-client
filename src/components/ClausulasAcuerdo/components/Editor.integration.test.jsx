import { Suspense } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Editor from "./Editor.jsx";

const editorMocks = vi.hoisted(() => ({ updateContent: vi.fn() }));

vi.mock("@tiptap/react", () => ({
	EditorContent: () => <div aria-label="Contenido del documento" />,
}));

vi.mock("../../Shared/components/DatePicker.jsx", () => ({
	default: ({ id, name, value, setField }) => (
		<input
			id={id}
			name={name}
			value={value ?? ""}
			onChange={(event) => setField(name, event.target.value)}
		/>
	),
}));

vi.mock("../hooks/useEditor.js", () => ({
	default: () => ({
		editor: {},
		showClausulasFieldsDialog: true,
		isBold: false,
		setShowClausulasFieldsDialog: vi.fn(),
		toggleBold: vi.fn(),
		updateContent: editorMocks.updateContent,
	}),
}));

beforeEach(() => editorMocks.updateContent.mockClear());

describe("Tiptap template integration", () => {
	it("incorpora los valores del reclamo y el formulario en el documento", async () => {
		const user = userEvent.setup();
		const onContentChange = vi.fn();
		render(
			<Suspense fallback={<div role="status">Cargando</div>}>
				<Editor
					initialContent={null}
					documentFields={{
						reclamado: "Empresa SA",
						rubros: "Diferencias salariales",
						reclamante: { dni: 12345678, nombre: "Ana López" },
					}}
					onChange={onContentChange}
				/>
			</Suspense>,
		);

		await user.click(await screen.findByRole("button", { name: "Insertar plantilla" }));
		const puesto = await screen.findByRole("textbox", { name: "Puesto" });
		expect(screen.getByRole("textbox", { name: "Reclamado" })).toHaveValue("Empresa SA");
		expect(screen.getByRole("textbox", { name: "Rubros" })).toHaveValue("Diferencias salariales");
		expect(screen.getByRole("textbox", { name: "Nombre" })).toHaveValue("Ana López");
		await user.type(puesto, "Administrativa");
		await user.click(screen.getByRole("button", { name: "Aceptar" }));

		await waitFor(() => expect(editorMocks.updateContent).toHaveBeenCalled());
		const template = editorMocks.updateContent.mock.lastCall[0];
		expect(template).toContain("Administrativa");
		expect(template).toContain("Empresa SA");
		expect(template).toContain("Diferencias salariales");
		expect(template).toContain("Ana López");
		expect(template).toContain("12.345.678");
	});
});