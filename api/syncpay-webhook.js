export default async function handler(request, response) {
  if (request.method !== "POST") return response.status(405).end();
  // SyncPay limits webhook responses to five seconds. Status is confirmed by polling.
  return response.status(204).end();
}
