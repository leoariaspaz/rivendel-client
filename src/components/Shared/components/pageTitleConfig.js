import { matchPath } from "react-router-dom";

export const routeTitles = [
  { path: "/", title: "Inicio" },

  { path: "/tipos-documentos", title: "Tipos de Documentos" },
  { path: "/tipos-documentos/new", title: "Nuevo tipos de documento" },
  { path: "/tipos-documentos/edit/:id", title: "Edición de tipos de documento" },

  { path: "/resoluciones", title: "Resoluciones" },
  { path: "/resoluciones/new", title: "Nueva resolución" },
  { path: "/resoluciones/edit/:id", title: "Edición de resolución" },

  { path: "/patrocinantes", title: "Patrocinantes" },
  { path: "/patrocinantes/new", title: "Nuevo patrocinante" },
  { path: "/patrocinantes/edit/:id", title: "Edición de patrocinante" },

  { path: "/partes", title: "Partes" },
  { path: "/partes/new", title: "Nueva parte" },
  { path: "/partes/edit/:id", title: "Edición de partes" },

  { path: "/reclamos", title: "Reclamos" },
  { path: "/reclamos/new", title: "Nuevo reclamo" },
  { path: "/reclamos/edit/:id", title: "Edición de reclamo" },
];

export const getCurrentRouteTitle = (pathname) => {
  const currentRoute = routeTitles.find((route) =>
    matchPath({ path: route.path, exact: true }, pathname)
  );

  return currentRoute ? currentRoute.title : "";
};
