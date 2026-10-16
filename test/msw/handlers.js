import { http, HttpResponse } from "msw";

export const handlers = [
	http.all("*", () => HttpResponse.json({ message: "Unhandled API request" }, { status: 404 })),
];