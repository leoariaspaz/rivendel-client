import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildDocument } from "./acta-builder.js";
import { Reclamos } from "../../api/repositories/reclamos.js";
import { ACUERDO, FRACASO } from "./tiposResoluciones.js";

vi.mock("../../api/repositories/reclamos.js", () => ({
  Reclamos: {
    get: vi.fn(),
  },
}));

const parte = (nombre) => ({
  nombre,
  tipoDocumento: { sintetico: "DNI" },
  nroDocumento: "123",
  cuil: "20-12345678-9",
  domicilio: "Calle 1",
  localidad: "Rosario",
  patrocinante: null,
  incomparendoParte: false,
});

const reclamo = (overrides = {}) => ({
  id: 5,
  numero: 42,
  idResolucion: ACUERDO,
  fechaHoraInicio: "2026-03-15T10:00:00",
  horaFin: "2026-03-15T11:00:00",
  proximaAudiencia: null,
  rubros: "Diferencias salariales",
  conciliador: { nombre: "Laura Pérez", nroHabilitacion: 77 },
  cantidad: 2,
  clausulas: {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: "Pago total" }] }],
  },
  reclamantes: [parte("Ana López")],
  reclamados: [parte("Empresa SA")],
  ...overrides,
});

describe("buildDocument", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("construye un documento de acuerdo con título y contenido", async () => {
    Reclamos.get.mockResolvedValue({
      ok: true,
      data: reclamo(),
    });

    const document = await buildDocument(5);

    expect(Reclamos.get).toHaveBeenCalledWith(5);
    expect(document).toMatchObject({
      pageSize: { width: 609.5, height: 935.5 },
      defaultStyle: { font: "Times", fontSize: 12 },
    });
    expect(document.content[0][0]).toMatchObject({ text: "RECLAMO Nº 42" });
    expect(document.content[0][1]).toMatchObject({
      text: "ACUERDO CONCILIATORIO",
      style: "header",
    });
    expect(document.content[0][2].text).toContain("DNI 123");
    expect(document.content[0][2].text).toContain("Ana López");
    expect(document.content[0][2].text).toContain("Empresa SA");
    expect(document.content[0][2].text).toContain("Laura Pérez");
    expect(document.content[0][3][0].text).toEqual([{ text: "Pago total" }]);
  });

  it("construye el documento de fracaso sin cláusulas de acuerdo", async () => {
    Reclamos.get.mockResolvedValue({
      ok: true,
      data: reclamo({
        numero: 8,
        idResolucion: FRACASO,
        rubros: "Despido",
        clausulas: null,
      }),
    });

    const document = await buildDocument(8);

    expect(document.content[0][0]).toMatchObject({
      text: "CERTIFICACIÓN DE FRACASO RECLAMO 8",
      style: "header",
    });
    expect(document.content[0][2].text[1].text).toBe("Despido");
    expect(document.content[0][3].text).toContain("no es posible arribar a un acuerdo conciliatorio");
  });

  it("genera un documento de error si falla la carga", async () => {
    Reclamos.get.mockResolvedValue({ ok: false, error: "Error de backend" });

    const document = await buildDocument(99);

    expect(document.content[0]).toMatchObject({
      text: "Error: Se produjo un error al obtener los datos del reclamo.",
      color: "red",
    });
  });

  it("genera un documento de error si no hay datos", async () => {
    Reclamos.get.mockResolvedValue({ ok: true, data: {} });

    const document = await buildDocument(100);

    expect(document.content[0].text).toBe(
      "Error: No se encontraron datos para el reclamo solicitado."
    );
  });
});
