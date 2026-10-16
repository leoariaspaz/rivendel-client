import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import Form from "./Form.jsx";
import { handleOnChange, handleSubmit } from "../eventHandlers.utils.js";
import useReclamoForm from "../hooks/useReclamoForm.js";
import { reducer, initialState } from "../reducer.js";
import { mapApiToForm, mapFormToApi } from "../mappers.js";
import { validateReclamo } from "../validators.js";
import { Reclamos } from "../../../api/repositories/reclamos.js";
import { ACUERDO, PENDIENTE, POSTERGADO } from "../tiposResoluciones.js";

vi.mock("../../../api/repositories/reclamos.js", () => ({
  Reclamos: {
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("../../Partes/components/SearchParteDialog", () => ({
  default: ({ title, visible }) => (visible ? <div>{title}</div> : null),
}));

vi.mock("../../Shared/components/DataBindedSelect.jsx", () => ({
  default: ({ data, selectedValue, setSelectedValue, id }) => (
    <select
      id={id ?? "resolucion"}
      data-testid={id ?? "resolucion"}
      value={selectedValue ?? 0}
      onChange={(e) => setSelectedValue(e.target.value)}
    >
      {data.map((item) => (
        <option key={item.value} value={item.value}>
          {item.text}
        </option>
      ))}
    </select>
  ),
}));

vi.mock("./PartesList", () => ({
  default: ({ esReclamante }) => (
    <div data-testid={esReclamante ? "reclamantes-list" : "reclamados-list"} />
  ),
}));

vi.mock("./ProximaAudienciaInput", () => ({
  ProximaAudienciaInput: ({ visible, value, handleOnChange }) =>
    visible ? (
      <input
        aria-label="prox-audiencia"
        value={value ?? ""}
        onChange={handleOnChange}
      />
    ) : null,
}));

vi.mock("../../ClausulasAcuerdo/components/ClausulasAcuerdoEditor", () => ({
  default: ({ visible }) => (visible ? <div data-testid="clausulas-editor" /> : null),
}));

vi.mock("../../Shared/components/DatePicker.jsx", () => ({
  default: ({ id, name, value, setField }) => (
    <input
      id={id}
      data-testid={id}
      name={name}
      value={value ?? ""}
      onChange={(e) => setField(name, e.target.value)}
    />
  ),
}));

vi.mock("./HourPicker", () => ({
  default: ({ id, name, value, setField }) => (
    <input
      id={id}
      data-testid={id}
      name={name}
      value={value ?? ""}
      onChange={(e) => setField(name, e.target.value)}
    />
  ),
}));

const renderForm = (initialPath = "/reclamos/new") =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/reclamos" element={<div>Listado de reclamos</div>} />
        <Route path="/reclamos/new" element={<Form />} />
        <Route path="/reclamos/edit/:id" element={<Form />} />
      </Routes>
    </MemoryRouter>
  );

const validState = {
  id: 0,
  numero: 42,
  fechaHoraInicio: "2026-03-15T10:00",
  horaFin: "11:30",
  idResolucion: PENDIENTE,
  proxAudiencia: "",
  rubros: "Cobro de deuda y gastos",
  reclamantes: [],
  reclamados: [],
  clausulas: null,
  reclamo: {},
  searchPartes: {
    show: false,
    esReclamante: true,
  },
  initializing: false,
  loading: false,
  errors: [],
};

const HookHarness = () => {
  const { state } = useReclamoForm(7);

  return (
    <div>
      <span data-testid="hook-id">{String(state.id)}</span>
      <span data-testid="hook-numero">{String(state.numero)}</span>
      <span data-testid="hook-rubros">{state.rubros}</span>
      <span data-testid="hook-resolucion">{String(state.idResolucion)}</span>
    </div>
  );
};

const AudienceHarness = () => {
  const { state, setField } = useReclamoForm();

  return (
    <>
      <output aria-label="Próxima audiencia">{state.proxAudiencia}</output>
      <button type="button" onClick={() => setField("idResolucion", POSTERGADO)}>Postergar</button>
      <button type="button" onClick={() => setField("proxAudiencia", "2026-04-10T10:00")}>Fijar audiencia</button>
      <button type="button" onClick={() => setField("idResolucion", PENDIENTE)}>Resolver</button>
    </>
  );
};

describe("<Form /> (Reclamos)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza el formulario en modo nuevo", async () => {
    renderForm();

    expect(screen.getByRole("heading", { name: /nuevo reclamo/i })).toBeInTheDocument();
    expect(document.getElementById("numero")).toBeInTheDocument();
    expect(await screen.findByTestId("fechaHoraInicio")).toBeInTheDocument();
    expect(await screen.findByTestId("horaFin")).toBeInTheDocument();
    expect(screen.getByTestId("resolucion")).toBeInTheDocument();
    expect(screen.getByLabelText(/rubros/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /grabar/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /cancelar/i })).toHaveAttribute("href", "/reclamos");
  });

  it("normaliza el número del reclamo en el onChange", () => {
    const setField = vi.fn();

    handleOnChange({ target: { id: "numero", value: "A12B", type: "number" } }, setField);

    expect(setField).toHaveBeenCalledWith("numero", 12);
  });

  it("valida el submit y no llama al backend si faltan datos obligatorios", async () => {
    const setErrors = vi.fn();
    const submitStart = vi.fn();
    const submitSuccess = vi.fn();
    const submitFail = vi.fn();
    const navigate = vi.fn();

    await handleSubmit(
      { preventDefault: vi.fn() },
      true,
      {
        ...validState,
        numero: 0,
        fechaHoraInicio: "",
        horaFin: "",
        idResolucion: 0,
        rubros: "",
      },
      setErrors,
      submitStart,
      submitSuccess,
      submitFail,
      navigate
    );

    expect(setErrors).toHaveBeenCalledWith([
      "Ingrese un número de reclamo válido",
      "Ingrese una fecha y hora de inicio válidas",
      "Seleccione una resolución válida",
    ]);
    expect(Reclamos.create).not.toHaveBeenCalled();
    expect(submitStart).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("crea un reclamo cuando el formulario es válido", async () => {
    Reclamos.create.mockResolvedValue({ ok: true });

    const setErrors = vi.fn();
    const submitStart = vi.fn();
    const submitSuccess = vi.fn();
    const submitFail = vi.fn();
    const navigate = vi.fn();

    await handleSubmit(
      { preventDefault: vi.fn() },
      true,
      validState,
      setErrors,
      submitStart,
      submitSuccess,
      submitFail,
      navigate
    );

    expect(submitStart).toHaveBeenCalledTimes(1);
    expect(Reclamos.create).toHaveBeenCalledTimes(1);
    expect(Reclamos.create).toHaveBeenCalledWith({
      id: 0,
      numero: 42,
      rubros: "Cobro de deuda y gastos",
      idResolucion: PENDIENTE,
      fechaHoraInicio: "2026-03-15T10:00:00-03:00",
      horaFin: "2026-03-15T11:30:00-03:00",
      proximaAudiencia: null,
      reclamantes: [],
      reclamados: [],
      clausulas: null,
    });
    expect(submitSuccess).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith("/reclamos", {
      state: { successMsg: "El reclamo Nº 42 se creó correctamente." },
    });
  });

  it("muestra el error que devuelve el backend si falla el guardado", async () => {
    Reclamos.create.mockResolvedValue({ ok: false, error: "No se pudo guardar el reclamo" });

    const setErrors = vi.fn();
    const submitStart = vi.fn();
    const submitSuccess = vi.fn();
    const submitFail = vi.fn();
    const navigate = vi.fn();

    await handleSubmit(
      { preventDefault: vi.fn() },
      true,
      validState,
      setErrors,
      submitStart,
      submitSuccess,
      submitFail,
      navigate
    );

    expect(submitFail).toHaveBeenCalledWith("No se pudo guardar el reclamo");
    expect(submitSuccess).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("carga un reclamo existente y actualiza el estado en modo edición", async () => {
    Reclamos.get.mockResolvedValue({
      ok: true,
      data: {
        id: 7,
        numero: 99,
        rubros: "Incidente legal",
        idResolucion: ACUERDO,
        fechaHoraInicio: "2026-03-15T10:00:00-03:00",
        horaFin: "2026-03-15T11:30:00-03:00",
        proximaAudiencia: null,
        reclamantes: [{ id: 1, nombre: "Juan" }],
        reclamados: [{ id: 2, nombre: "Empresa SA" }],
        clausulas: { texto: "clausula" },
      },
    });

    render(
      <MemoryRouter initialEntries={["/reclamos/edit/7"]}>
        <Routes>
          <Route path="/reclamos/edit/:id" element={<HookHarness />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("hook-id")).toHaveTextContent("7");
      expect(screen.getByTestId("hook-numero")).toHaveTextContent("99");
      expect(screen.getByTestId("hook-rubros")).toHaveTextContent("Incidente legal");
      expect(screen.getByTestId("hook-resolucion")).toHaveTextContent(String(ACUERDO));
    });

    expect(Reclamos.get).toHaveBeenCalledWith(7);
  });

  it("limpia proxAudiencia cuando la resolución no es postergado", async () => {
    const user = userEvent.setup();
    render(<AudienceHarness />);

    await user.click(screen.getByRole("button", { name: "Postergar" }));
    await user.click(screen.getByRole("button", { name: "Fijar audiencia" }));
    expect(screen.getByLabelText("Próxima audiencia")).toHaveTextContent("2026-04-10T10:00");

    await user.click(screen.getByRole("button", { name: "Resolver" }));
    expect(screen.getByLabelText("Próxima audiencia")).toBeEmptyDOMElement();
  });

  it("valida que la próxima audiencia sea obligatoria cuando la resolución es postergado", () => {
    const errors = validateReclamo({
      ...validState,
      idResolucion: POSTERGADO,
      proxAudiencia: "",
    });

    expect(errors).toContain("Ingrese una próxima fecha válida");
  });

  it("valida que la próxima fecha no sea anterior a la fecha de inicio", () => {
    const errors = validateReclamo({
      ...validState,
      idResolucion: POSTERGADO,
      fechaHoraInicio: "2026-05-20T10:00",
      proxAudiencia: "2026-05-19T10:00",
    });

    expect(errors).toContain("La próxima fecha no puede ser anterior a la fecha hora de inicio.");
  });

  it("mapea los datos del backend a formato del formulario y viceversa", () => {
    const apiData = {
      id: 9,
      numero: 55,
      rubros: "Texto",
      idResolucion: 3,
      fechaHoraInicio: "2026-06-10T10:00:00-03:00",
      horaFin: "2026-06-10T11:00:00-03:00",
      proximaAudiencia: "2026-06-11T09:00:00-03:00",
      reclamantes: [{ id: 1, nombre: "Ana" }],
      reclamados: [{ id: 2, nombre: "Luis" }],
      clausulas: { texto: "acuerdo" },
    };

    const formState = mapApiToForm(apiData);
    expect(formState).toMatchObject({
      id: 9,
      numero: 55,
      rubros: "Texto",
      idResolucion: 3,
      fechaHoraInicio: "2026-06-10T10:00",
      horaFin: "11:00",
      proxAudiencia: "2026-06-11T09:00",
      reclamantes: [{ id: 1, nombre: "Ana" }],
      reclamados: [{ id: 2, nombre: "Luis" }],
    });

    const apiPayload = mapFormToApi({
      ...validState,
      id: 9,
      numero: 55,
      horaFin: "11:00",
      fechaHoraInicio: "2026-06-10T10:00",
      proxAudiencia: "2026-06-11T09:00",
      reclamantes: [{ id: 1, nombre: "Ana" }],
      reclamados: [{ id: 2, nombre: "Luis" }],
      clausulas: JSON.stringify({ texto: "acuerdo" }),
    });

    expect(apiPayload).toMatchObject({
      id: 9,
      numero: 55,
      idResolucion: PENDIENTE,
      fechaHoraInicio: "2026-06-10T10:00:00-03:00",
      horaFin: "2026-06-10T11:00:00-03:00",
      proximaAudiencia: "2026-06-11T09:00",
      reclamantes: [{ idParte: 1, nroWhatsappParte: null, nroWhatsappPatrocinante: null, postergo: false, incomparendoParte: false, incomparendoPatrocinante: false, multado: false }],
      reclamados: [{ idParte: 2, nroWhatsappParte: null, nroWhatsappPatrocinante: null, postergo: false, incomparendoParte: false, incomparendoPatrocinante: false, multado: false }],
    });
  });

  it("maneja el reducer para estados de error y carga inicial", () => {
    const afterField = reducer(initialState, { type: "SET_FIELD", field: "numero", value: 42 });
    expect(afterField.numero).toBe(42);
    expect(afterField.errors).toEqual([]);

    const afterFail = reducer(initialState, { type: "SUBMIT_FAIL", errors: "Error general" });
    expect(afterFail.errors).toEqual(["Error general"]);

    const afterLoad = reducer(initialState, { type: "INITIAL_LOAD", payload: { id: 3, numero: 77 } });
    expect(afterLoad.id).toBe(3);
    expect(afterLoad.numero).toBe(77);
    expect(afterLoad.initializing).toBe(false);
  });
});
