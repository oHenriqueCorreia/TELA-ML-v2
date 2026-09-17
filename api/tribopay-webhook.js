export default async function handler(request, response) {
  if (request.method !== "POST") return response.status(405).end();
  return response.status(204).end();
}
