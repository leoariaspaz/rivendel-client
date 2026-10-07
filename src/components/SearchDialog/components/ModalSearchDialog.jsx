import { useRef } from 'react';
import { SEARCH } from '../../Shared/components/Icons';
import useSearchDialog from '../hooks/useSearchDialog';
import { handleKeyDown } from '../event-handlers';
import Content from './Content';

export default function ModalSearchDialog({
	title,
	placeholder,
	columns = undefined,          // [{ key: 'nombre', label: 'Nombre' }, ...]
	template = undefined,         // JSX.Element
	searchFn,         						// (term: string) => Promise<Response>
	onAccept,
	onCancel,
	minTermLength = 3,
	debounceMs = 300,
	emptyMessage = "No hay datos para mostrar.",
	visible = true
}) {

	const inputRef = useRef(null);

	const {term, data, selected, selectedId, done, error, loading,
		setTerm, selectRow, buscar} = useSearchDialog(searchFn, inputRef, { minTermLength, debounceMs });


	const contentClassName = error
		? "bg-danger-subtle border-danger"
		: "bg-warning-subtle border-warning";

	if (!visible) return null;

	return (
		<div className="modal show modal-backdrop-50 dialog-centered d-flex" tabIndex="-1"
			onKeyDown={(e) => handleKeyDown(e, buscar, onCancel) }>
			<div className="modal-dialog center-vertical min-vw-100">
				<div className="modal-content w-50">
					<div className="modal-header bg-success text-white">
						<h5 className="modal-title">{title}</h5>
					</div>
					<div className="modal-body">
						<div className="row mb-3">
							<div className="col-11">
								<input
									ref={inputRef}
									type="text"
									className="form-control"
									placeholder={placeholder}
									autoComplete="off"
									value={term}
									onChange={(e) => setTerm(e.target.value)}
									autoFocus
								/>
							</div>
							<div className="col-1">
								<button type="button" className="btn btn-outline-primary" onClick={buscar}>
									{SEARCH}
								</button>
							</div>
						</div>

						<Content 
							data={data}
							columns={columns}
							template={template}
							emptyMessage={emptyMessage}
							selectedId={selectedId}
							selectRow={selectRow}
							className={contentClassName}
							visible={done}
							error={error}
						/>

					</div>
					<div className="modal-footer">
						<button
							type="button"
							className="btn btn-success"
							onClick={(e) => onAccept(e, selected)}
							disabled={!selected || loading}
						>
							Aceptar
						</button>
						<button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
							Cancelar
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};