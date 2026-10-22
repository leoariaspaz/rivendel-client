import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Layout from "./Layout.jsx";
import { logout } from "../../api/auth.repository";
import { safeNavigate } from "../../utils/navigation.js";
import NotificationProvider from "../../contexts/NotificationProvider.jsx";
import { toast } from "react-toastify";

const tourMocks = vi.hoisted(() => ({
  iniciarTour: vi.fn(),
  getTourVisto: vi.fn(() => true),
}));

vi.mock("../../api/auth.repository", () => ({
  logout: vi.fn(),
}));

vi.mock("../../dtos/userName", () => ({
  getUserName: vi.fn(() => "Usuario Actual"),
}));

vi.mock("../../utils/navigation.js", () => ({
  safeNavigate: vi.fn(),
}));

vi.mock("../../contexts/NotificationProvider.jsx", async () => {
  const actual = await vi.importActual("../../contexts/NotificationProvider.jsx");
  return {
    default: actual.default,
  };
});

vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Bounce: "bounce",
  ToastContainer: () => <div data-testid="toast-container" />,
}));

vi.mock("./hooks/useTourInicial", () => ({
  useTourInicial: () => ({
    iniciarTour: tourMocks.iniciarTour,
    getTourVisto: tourMocks.getTourVisto,
  }),
}));

const renderLayout = (initialPath = "/") =>
  render(
    <NotificationProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Layout>
          <div>Contenido de prueba</div>
        </Layout>
      </MemoryRouter>
    </NotificationProvider>
  );

describe("Layout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    logout.mockResolvedValue();
    tourMocks.getTourVisto.mockReturnValue(true);
  });

  it("renderiza navegación, usuario y contenido principal", () => {
    renderLayout();

    expect(screen.getByText("Conciliaciones")).toBeInTheDocument();
    expect(screen.getByText("Patrocinantes")).toBeInTheDocument();
    expect(screen.getByText("Partes")).toBeInTheDocument();
    expect(screen.getByText("Reclamos")).toBeInTheDocument();
    expect(screen.getByText("Contenido de prueba")).toBeInTheDocument();
    expect(screen.getByText("Usuario Actual")).toBeInTheDocument();
  });

  it("marca la ruta actual y comienza el tour si todavía no fue visto", async () => {
    tourMocks.getTourVisto.mockReturnValueOnce(false);

    renderLayout("/partes");

    expect(screen.getByRole("link", { name: "Partes" })).toHaveClass("active");
    await waitFor(() => expect(tourMocks.iniciarTour).toHaveBeenCalledOnce());
  });

  it("cierra sesión y navega a la ruta raíz con replace", async () => {
    renderLayout();

    fireEvent.click(screen.getByTitle("Cerrar sesión"));

    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1));
    expect(safeNavigate).toHaveBeenCalledWith("/", { replace: true });
  });

  it("muestra el mensaje de error cuando el logout falla", async () => {
    logout.mockRejectedValueOnce(new Error("fail"));

    renderLayout();

    fireEvent.click(screen.getByTitle("Cerrar sesión"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Error al cerrar sesión. Intente nuevamente.",
        expect.objectContaining({ autoClose: 5000, toastId: "Error al cerrar sesión. Intente nuevamente." })
      );
    });
  });
});
