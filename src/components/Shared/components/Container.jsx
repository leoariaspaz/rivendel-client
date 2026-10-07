import { Link, useLocation } from "react-router-dom";
import { FILEEARMARKPLUS } from "./Icons";
import { useMemo } from "react";
import { getCurrentRouteTitle } from "./pageTitleConfig.js";

const Container = ({children, title = "", pathToNew}) => {
	const location = useLocation();
	const headerTitle = useMemo(() => {
		if (title) return title;
		return getCurrentRouteTitle(location.pathname);
	}, [location.pathname, title]);

	return (
		<div className="container mt-4">
			<div>
				<div className="col-8 d-inline-block">
						<h1>{headerTitle}</h1>
				</div>
				<div className="col-4 d-inline-flex justify-content-end">
					<Link to={pathToNew} className="btn btn-outline-primary mb-2 d-inline-flex align-items-center justify-content-center" title="Nuevo">
						{FILEEARMARKPLUS}
					</Link>
				</div>
			</div>
			{children}
		</div>
	);
}

export default Container;
