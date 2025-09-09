import { sessionToken } from "./auth";

const API = import.meta.env.VITE_API_BASE as string;
// TEMP fallback until you hook API Gateway to Cognito:
const USER = import.meta.env.VITE_USER_ID as string | undefined;

type FetchInit = RequestInit & { json?: any };

export async function api(path: string, init: FetchInit = {}) {
  const { json, headers, ...rest } = init;
  const token = await sessionToken().catch(() => null);
  const r = await fetch(`${API}${path}`, {
    ...rest,
    headers: {
      ...(json ? { "content-type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(!token && USER ? { "x-user-id": USER } : {}), // remove once JWT is live
      ...(headers || {}),
    },
    body: json ? JSON.stringify(json) : init.body,
  });
  if (!r.ok) throw new Error(await r.text().catch(() => r.statusText));
  return r.status === 204 ? null : r.json();
}
