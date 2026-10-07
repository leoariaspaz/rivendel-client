import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getCurrentRouteTitle } from "./pageTitleConfig.js";

const PageTitle = () => {
  const location = useLocation();

  useEffect(() => {
    const currentRouteTitle = getCurrentRouteTitle(location.pathname);

    if (location.pathname === "/") {
      document.title = "Inicio | Rivendel | Conciliaciones";
      return;
    }

    document.title = (currentRouteTitle ? `${currentRouteTitle} | ` : "") + "Conciliaciones";
  }, [location]);

  return null;
};

export default PageTitle;