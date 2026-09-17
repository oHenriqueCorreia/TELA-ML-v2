import { getPublicUrl, sendJson, triboPayFetch, validateCustomer } from "./_tribopay.js";

const AMOUNT_IN_CENTS = 5990;
const PRODUCT_TITLE = "Jogo de Panelas Antiaderente Teflon 8 Peças Cereja";

export default async function handler(request, response) {
  if (request.method !== "POST") return sendJson(response, { error: "Método não permitido." }, 405);
  try {
    const payload = typeof request.body === "string" ? JSON.parse(request.body) : request.body;
    const client = validateCustomer(payload);
    if (!client) return sendJson(response, { error: "Informe nome, CPF, e-mail e telefone válidos." }, 422);
    const offerHash = process.env.TRIBOPAY_OFFER_HASH || "kdzbp2ak2e", productHash = process.env.TRIBOPAY_PRODUCT_HASH || "i74ou8qbjc";
    if (!offerHash || !productHash) return sendJson(response, { error: "Os identificadores do produto Tribo Pay ainda não foram configurados." }, 503);
    const webhookUrl = process.env.TRIBOPAY_WEBHOOK_URL || getPublicUrl(request) + "/api/tribopay-webhook";
    const result = await triboPayFetch("/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: AMOUNT_IN_CENTS, offer_hash: offerHash, payment_method: "pix", customer: { name: client.name, email: client.email, phone_number: client.phone, document: client.cpf }, cart: [{ product_hash: productHash, title: PRODUCT_TITLE, cover: null, price: AMOUNT_IN_CENTS, quantity: 1, operation_type: 1, tangible: true }], expire_in_days: 1, transaction_origin: "api", postback_url: webhookUrl }) });
    const transaction = result.data && result.data.data;
    if (!result.response.ok || !transaction || !transaction.pix_code || !transaction.hash) return sendJson(response, { error: result.data.message || "A Tribo Pay não conseguiu criar a cobrança." }, result.response.status >= 400 && result.response.status < 500 ? result.response.status : 502);
    return sendJson(response, { amount: AMOUNT_IN_CENTS / 100, transactionHash: transaction.hash, pixCode: transaction.pix_code, qrCode: transaction.qr_code || null, status: transaction.status || "pending" });
  } catch (error) { return sendJson(response, { error: error.message || "Não foi possível gerar a cobrança Pix." }, error.status || 500); }
}