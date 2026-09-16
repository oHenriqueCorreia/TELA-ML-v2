import { getPublicUrl, sendJson, syncPayFetch, validateCustomer } from "./_syncpay.js";

const AMOUNT = 59.9;
const DESCRIPTION = "Jogo de Panelas Antiaderente Teflon 8 Pe?as Cereja";

export default async function handler(request, response) {
  if (request.method !== "POST") return sendJson(response, { error: "M?todo n?o permitido." }, 405);
  try {
    const payload = typeof request.body === "string" ? JSON.parse(request.body) : request.body; const client = validateCustomer(payload);
    if (!client) return sendJson(response, { error: "Informe nome, CPF, e-mail e telefone v?lidos." }, 422);
    const webhookUrl = process.env.SYNC_PAY_WEBHOOK_URL || getPublicUrl(request) + "/api/syncpay-webhook";
    const result = await syncPayFetch("/api/partner/v1/cash-in", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: AMOUNT, description: DESCRIPTION, webhook_url: webhookUrl, client }) });
    if (!result.response.ok || !result.data.pix_code || !result.data.identifier) return sendJson(response, { error: result.data.message || "A SyncPay n?o conseguiu criar a cobran?a." }, result.response.status >= 400 && result.response.status < 500 ? result.response.status : 502);
    return sendJson(response, { amount: AMOUNT, identifier: result.data.identifier, pixCode: result.data.pix_code, status: "pending" });
  } catch (error) { return sendJson(response, { error: error.message || "N?o foi poss?vel gerar a cobran?a Pix." }, error.status || 500); }
}
