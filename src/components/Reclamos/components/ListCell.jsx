import dayjs from "dayjs";
import { RECLAMANTE, RECLAMADO } from "../../Shared/constants.js";
import DeleteMessage from "../../Shared/components/DeleteMessage.jsx"
import { GridEditButton, GridDeleteButton, GridPrintButton } from "../../Grid/components/GridButtons.jsx";
import { ANULADO, ACUERDO, FRACASO, getResolucionText, PENDIENTE, POSTERGADO } from "../tiposResoluciones.js";

const getDeleteMessage = (rec) => {
	const s = `¿Está seguro que desea eliminar el reclamo Nº ${rec.numero}?`;
	return (<DeleteMessage message={s} />)
}

const handlePrint = async (e, id) => {
	e.preventDefault();

  const { default: createActa } = await import('../acta-builder.js');
	await createActa(id);
};

const getBadgeColor = (resolucionId) => {
	switch (resolucionId) {
		case PENDIENTE:
			return "badge bg-warning-subtle text-warning-emphasis fs-very-small rounded-pill";
		case FRACASO:
			return "badge bg-danger-subtle text-danger fs-very-small rounded-pill";
			//return "badge bg-dark-subtle text-secondary fs-very-small rounded-pill";
		case ACUERDO:
			return "badge bg-success fs-very-small rounded-pill";
		case POSTERGADO:
			return "badge bg-primary-subtle text-primary fs-very-small rounded-pill";
		case ANULADO:
			return "badge bg-danger-subtle text-dark fs-very-small rounded-pill";
		default:
			return "badge bg-secondary fs-very-small";
	}
}

export default function ListCell(rec, onDeleteRecord) {
	return (
		<>
			<div className="row bg-secondary-subtle rounded-1">
				<div className="col m-1">
					<div className="row">
						<div className="col-11">
							<div className="row">
								<div className="col-2 d-flex align-items-center text-success">
									<div className="h3 fw-bold mb-2">Nº {rec.numero}</div>
								</div>
								<div className="col-6 d-flex align-items-center small">
									<span>{dayjs(rec.fechaHoraInicio).format("DD [de] MMMM [de] YYYY - HH:mm [hs]")}</span>
									{(dayjs(rec.horaFin).isValid()) && (
									<>
										<span className="ms-1 me-1">hasta</span>
										<span>{dayjs(rec.horaFin).format("HH:mm [hs]")}</span>
									</>)}
								</div>
								<div className="col-4 d-flex align-items-center justify-content-end">
									{rec.proximaAudiencia && (
										<span className="text-primary me-2 fw-light" style={{fontSize: "0.75em"}}>
											Próxima audiencia: {dayjs(rec.proximaAudiencia).format("DD/MM/YYYY HH:mm")}
										</span>
									)}
									<span className={getBadgeColor(rec.idResolucion)}>{getResolucionText(rec.idResolucion)}</span>
								</div>
							</div>
							<div className="row">
								<div className="col-6 border border-secondary-subtle rounded p-2">
									<div className="h6 mb-2">Reclamantes</div>
									<span>
										{rec.partes.filter(p => p.rol === RECLAMANTE).map((r) => r.parte.nombre).join(", ")}
									</span>
								</div>
								<div className="col-6 border border-secondary-subtle rounded p-2">
									<div className="h6 mb-2">Reclamados</div>
									<span>
										{rec.partes.filter(p => p.rol === RECLAMADO).map((r) => r.parte.nombre).join(", ")}
									</span>
								</div>
							</div>
						</div>
						<div className="col-1 d-flex align-items-center">
							<div className="row">
								<div className="col mb-1">
									<GridEditButton path={`/reclamos/edit/${rec.id}`} className={"w-100"} />
								</div>
								{(rec.idResolucion !== PENDIENTE) && (
								<div className="col mb-1">
									<GridPrintButton path={`/reclamos/acta/${rec.id}`} className={"w-100"} onClick={(e) => handlePrint(e, rec.id)} />
								</div>)}
								<div className="col">
									<GridDeleteButton path={`/reclamos/delete/${rec.id}`} onDelete={(e) => onDeleteRecord(e, rec.id, getDeleteMessage(rec))}
										className={"w-100"}/>
								</div>
							</div>
							
						</div>
					</div>
				</div>
			</div>
		</>
	);
}