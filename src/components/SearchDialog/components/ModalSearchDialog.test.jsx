import { describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import ModalSearchDialog from "./ModalSearchDialog.jsx";

const rows = [
  { id: 1, nombre: "Ana", documento: "123" },
  { id: 2, nombre: "Luis", documento: "456" },
];

const columns = [
  { key: "nombre", label: "Nombre" },
  { key: "documento", label: "Documento" },
];

const renderDialog = (props = {}) => {
  const searchFn = props.searchFn ?? vi.fn().mockResolvedValue({ ok: true, data: { data: rows } });
  const onAccept = props.onAccept ?? vi.fn();
  const onCancel = props.onCancel ?? vi.fn();

  const renderResult = render(
    <ModalSearchDialog
      title="Buscar parte"
      placeholder="Nombre o CUIL"
      columns={columns}
      searchFn={searchFn}
      onAccept={onAccept}
      onCancel={onCancel}
      debounceMs={1000}
      {...props}
    />
  );

  return { searchFn, onAccept, onCancel, ...renderResult };
};

describe("<ModalSearchDialog />", () => {
  it("no renderiza cuando visible es false", () => {
    const { container } = renderDialog({
      title: "Buscar",
      placeholder: "Buscar",
      visible: false,
      searchFn: vi.fn(),
      onAccept: vi.fn(),
      onCancel: vi.fn(),
    });

    expect(container).toBeEmptyDOMElement();
  });

  it("renderiza el modal y deshabilita aceptar sin selección", () => {
    renderDialog();

    expect(
      screen.getByRole("heading", { name: "Buscar parte" })
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Buscar parte" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Nombre o CUIL" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Buscar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aceptar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
  });

  it("busca, selecciona un resultado y lo acepta", async () => {
    const user = userEvent.setup();
    const { searchFn, onAccept } = renderDialog();
    const input = screen.getByRole("textbox", { name: "Nombre o CUIL" });

    await user.type(input, "ana");
    await user.click(screen.getByRole("button", { name: "Aceptar" }));
    expect(onAccept).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Buscar" }));
    await waitFor(() => expect(searchFn).toHaveBeenCalledWith("ana"));
    await waitFor(() => expect(screen.getByText("Ana")).toBeInTheDocument());

    await act(async () => user.click(screen.getByText("Ana")));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Aceptar" })).toBeEnabled();
    });

    await user.click(screen.getByRole("button", { name: "Aceptar" }));

    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(onAccept.mock.calls[0][1]).toEqual(rows[0]);
  });

  it("cancela mediante botón y Escape", async () => {
    const user = userEvent.setup();
    const { onCancel } = renderDialog();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    await user.keyboard("{Escape}");

    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it("muestra el error devuelto por la búsqueda", async () => {
    const user = userEvent.setup();
    const searchFn = vi.fn().mockResolvedValue({ ok: false, error: "500" });
    renderDialog({ searchFn });

    await user.type(screen.getByRole("textbox", { name: "Nombre o CUIL" }), "ana");
    await user.click(screen.getByRole("button", { name: "Buscar" }));

    await waitFor(() => {
      expect(
        screen.getByText(
          "Ocurrió un error al realizar la búsqueda. Por favor, inténtelo de nuevo."
        )
      ).toBeInTheDocument();
    });
  });

  it("no presenta violaciones axe al abrirse", async () => {
    const { container } = renderDialog();

    expect(await axe(container)).toHaveNoViolations();
  });
});
