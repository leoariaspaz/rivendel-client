import { fireEvent, render, screen } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import Container from "./Container.jsx";
import PageTitle from "./PageTitle.jsx";

const renderPageTitle = (initialPath) =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/" element={<PageTitle />} />
        <Route path="/reclamos/new" element={<PageTitle />} />
        <Route path="/reclamos/edit/:id" element={<PageTitle />} />
        <Route path="/patrocinantes" element={<PageTitle />} />
      </Routes>
    </MemoryRouter>
  );

describe("PageTitle", () => {
  beforeEach(() => {
    document.title = "";
  });

  it("actualiza el título para la ruta principal", () => {
    renderPageTitle("/");

    expect(document.title).toBe("Inicio | Rivendel | Conciliaciones");
  });

  it("actualiza el título para una ruta de reclamo nuevo", () => {
    renderPageTitle("/reclamos/new");

    expect(document.title).toBe("Nuevo reclamo | Conciliaciones");
  });

  it("actualiza el título para una ruta de patrocinantes", () => {
    renderPageTitle("/patrocinantes");

    expect(document.title).toBe("Patrocinantes | Conciliaciones");
  });

  it("renderiza sin contenido visual", () => {
    renderPageTitle("/reclamos/edit/42");

    expect(screen.queryByText(/.+/)).not.toBeInTheDocument();
  });

  it("actualiza el título del container al navegar entre páginas", () => {
    render(
      <MemoryRouter initialEntries={["/partes"]}>
        <PageTitle />
        <Routes>
          <Route path="/partes" element={<Container><p>Partes page</p></Container>} />
          <Route path="/reclamos" element={<Container><p>Reclamos page</p></Container>} />
        </Routes>
        <Link to="/reclamos">Ir a reclamos</Link>
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Partes" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: "Ir a reclamos" }));

    expect(screen.getByRole("heading", { name: "Reclamos" })).toBeInTheDocument();
  });
});
