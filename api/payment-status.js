import { sendJson, triboPayFetch } from "./_tribopay.js";

export default async function handler(request, response) {
  if (request.method !== "GET") return sendJson(response, { error: "Método não permitido." }, 405);
  const identifier = String((request.query && request.query.identifier) || "");
  if (!/^[a-z0-9_-]{6,128}$/i.test(identifier)) return sendJson(response, { error: "Identificador inválido." }, 400);
  try { const result = await triboPayFetch("/transactions/" + encodeURIComponent(identifier)); const transaction = result.data && ((result.data.data && typeof result.data.data === "object" ? result.data.data : null) || (result.data.transaction && typeof result.data.transaction === "object" ? result.data.transaction : null) || result.data); if (!result.response.ok || !transaction) return sendJson(response, { error: result.data.message || "Não foi possível consultar a cobrança." }, result.response.status === 404 ? 404 : 502); return sendJson(response, { identifier, status: transaction.status || transaction.payment_status, amount: transaction.amount }); }
  catch (error) { return sendJson(response, { error: error.message || "Não foi possível consultar a cobrança." }, error.status || 500); }
}