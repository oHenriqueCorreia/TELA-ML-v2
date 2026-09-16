import { sendJson, syncPayFetch } from "./_syncpay.js";

export default async function handler(request, response) {
  if (request.method !== "GET") return sendJson(response, { error: "M?todo n?o permitido." }, 405);
  const identifier = String((request.query && request.query.identifier) || "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier)) return sendJson(response, { error: "Identificador inv?lido." }, 400);
  try { const result = await syncPayFetch("/api/partner/v1/transaction/" + identifier); if (!result.response.ok || !result.data.data) return sendJson(response, { error: result.data.message || "N?o foi poss?vel consultar a cobran?a." }, result.response.status === 404 ? 404 : 502); return sendJson(response, { identifier, status: result.data.data.status, amount: result.data.data.amount }); }
  catch (error) { return sendJson(response, { error: error.message || "N?o foi poss?vel consultar a cobran?a." }, error.status || 500); }
}
