import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationContext } from "../../../contexts/Constants.jsx";
import { BUTTON_COLUMN, DATA_COLUMN, DELETE_BUTTON, EDIT_BUTTON } from "../../Shared/constants.js";
import Grid from "./Grid.jsx";

const showSuccess = vi.fn();
const showError = vi.fn();

const renderGrid = ({ findAll, deleteItem = vi.fn(), location = "/" } = {}) => {
  const endpoints = {
    findAll: findAll ?? vi.fn().mockResolvedValue({
      ok: true,
      data: {
        data: [{ id: 1, nombre: "Ana" }],
        totalPages: 2,
      },
    }),
    delete: deleteItem,
  };

  const columnBuilder = ({ data, onDelete }) => ({
    key: data.id,
    columns: [
      { type: DATA_COLUMN, data: data.nombre },
      {
        type: BUTTON_COLUMN,
        buttons: [
          { type: EDIT_BUTTON, path: `/records/edit/${data.id}` },
          {
            type: DELETE_BUTTON,
            path: `/records/delete/${data.id}`,
            id: data.id,
            message: <span>Eliminar {data.nombre}</span>,
            onDelete,
          },
        ],
      },
    ],
  });

  render(
    <NotificationContext.Provider value={{ showSuccess, showError }}>
      <MemoryRouter initialEntries={[location]}>
        <Grid
          endpoints={endpoints}
          columnBuilder={columnBuilder}
          headers={["Nombre", "Acciones"]}
          recordsPerPage={15}
          showSearchBar
          searchPlaceHolder="Buscar registro"
        />
      </MemoryRouter>
    </NotificationContext.Provider>
  );

  return { endpoints };
};

describe("<Grid />", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("carga datos y renderiza filas, headers y acciones", async () => {
    renderGrid();

    await waitFor(() => expect(screen.getByText("Ana")).toBeInTheDocument());

    expect(screen.getByRole("columnheader", { name: "Nombre" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Acciones" })).toBeInTheDocument();
    expect(screen.getByTitle("Editar")).toHaveAttribute("href", "/records/edit/1");
    expect(screen.getByTitle("Eliminar")).toHaveAttribute("href", "/records/delete/1");
  });

  it("muestra loading mientras la búsqueda está pendiente", async () => {
    let resolveRequest;
    const findAll = vi.fn().mockReturnValue(new Promise((resolve) => {
      resolveRequest = resolve;
    }));
    renderGrid({ findAll });

    expect(screen.getByText("Cargando...")).toBeInTheDocument();
    resolveRequest({ ok: true, data: { data: [], totalPages: 0 } });

    await waitFor(() => expect(screen.getByText("No hay datos para mostrar")).toBeInTheDocument());
  });

  it("muestra mensaje vacío y propaga errores de búsqueda", async () => {
    const findAll = vi.fn().mockResolvedValue({ ok: false, error: "No se pudo buscar" });
    renderGrid({ findAll });

    await waitFor(() => expect(showError).toHaveBeenCalledWith("No se pudo buscar"));
    expect(screen.getByText("No hay datos para mostrar")).toBeInTheDocument();
  });

  it("filtra por búsqueda después del debounce", async () => {
    const findAll = vi.fn().mockResolvedValue({ ok: true, data: { data: [], totalPages: 0 } });
    renderGrid({ findAll });
    await waitFor(() => expect(findAll).toHaveBeenCalledWith({ currentPage: 1, recordsPerPage: 15, query: "" }));

    fireEvent.change(screen.getByPlaceholderText("Buscar registro"), {
      target: { value: "  Ana  " },
    });
    await waitFor(() => expect(findAll).toHaveBeenLastCalledWith({ currentPage: 1, recordsPerPage: 15, query: "Ana" }));
  });

  it("cambia de página con el paginador", async () => {
    const findAll = vi.fn().mockResolvedValue({ ok: true, data: { data: [{ id: 1, nombre: "Ana" }], totalPages: 2 } });
    renderGrid({ findAll });
    await waitFor(() => expect(findAll).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    await waitFor(() => expect(findAll).toHaveBeenLastCalledWith({ currentPage: 2, recordsPerPage: 15, query: "" }));
  });

  it("confirma eliminación, actualiza la fila y notifica éxito", async () => {
    const deleteItem = vi.fn().mockResolvedValue({ ok: true });
    renderGrid({ deleteItem });
    await waitFor(() => expect(screen.getByText("Ana")).toBeInTheDocument());

    fireEvent.click(screen.getByTitle("Eliminar"));
    expect(screen.getByText("Eliminar Ana")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    await waitFor(() => expect(deleteItem).toHaveBeenCalledWith(1));

    expect(screen.queryByText("Ana")).not.toBeInTheDocument();
    expect(showSuccess).toHaveBeenCalledWith("Se eliminó correctamente el registro.");
  });

  it("muestra una notificación de éxito proveniente de la ruta", async () => {
    renderGrid({ location: { pathname: "/records", state: { successMsg: "Guardado" } } });

    await waitFor(() => expect(showSuccess).toHaveBeenCalledWith("Guardado"));
  });
});
