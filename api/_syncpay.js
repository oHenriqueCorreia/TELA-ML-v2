const API_BASE_URL = "https://api.syncpayments.com.br";

let cachedToken = null;
let tokenExpiresAt = 0;

export function sendJson(response, body, status = 200) {
  response.status(status).setHeader("Cache-Control", "no-store").json(body);
}

export function getPublicUrl(request) {
  const configuredUrl = process.env.SYNC_PAY_WEBHOOK_URL;
  if (configuredUrl) return configuredUrl.replace(/\/api\/syncpay-webhook\/?$/, "");
  const protocol = request.headers["x-forwarded-proto"] || "https";
  const host = request.headers["x-forwarded-host"] || request.headers.host;
  if (!host) throw new Error("N?o foi poss?vel determinar a URL p?blica do site.");
  return protocol + "://" + host;
}

export async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;
  const clientId = process.env.SYNC_PAY_CLIENT_ID;
  const clientSecret = process.env.SYNC_PAY_CLIENT_SECRET;
  if (!clientId || !clientSecret) { const error = new Error("A integra??o SyncPay ainda n?o foi configurada."); error.status = 503; throw error; }
  const response = await fetch(API_BASE_URL + "/api/partner/v1/auth-token", { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }) });
  const data = await readJson(response);
  if (!response.ok || !data.access_token) { const error = new Error(data.message || "N?o foi poss?vel autenticar na SyncPay."); error.status = 502; throw error; }
  cachedToken = data.access_token; tokenExpiresAt = Date.now() + Math.max(60, Number(data.expires_in || 3600) - 60) * 1000; return cachedToken;
}

export async function syncPayFetch(path, options = {}) {
  const token = await getAccessToken();
  const response = await fetch(API_BASE_URL + path, { ...options, headers: { Accept: "application/json", Authorization: "Bearer " + token, ...options.headers } });
  return { response, data: await readJson(response) };
}

export function validateCustomer(value) {
  const client = value && value.client; if (!client || typeof client !== "object") return null;
  const name = String(client.name || "").trim().replace(/\s+/g, " "); const cpf = String(client.cpf || "").replace(/\D/g, ""); const email = String(client.email || "").trim().toLowerCase(); const phone = String(client.phone || "").replace(/\D/g, "");
  if (name.length < 3 || !/^\d{11}$/.test(cpf) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{10,11}$/.test(phone)) return null;
  return { name, cpf, email, phone };
}

async function readJson(response) { const text = await response.text(); try { return text ? JSON.parse(text) : {}; } catch { return { message: text }; } }
