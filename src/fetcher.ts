import { adminAccount } from "./sneaker-consign/admin-account";

export function POST(url: string, body: unknown, token?: boolean) {
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token
        ? {
            "Auth-Token": `Bearer ${adminAccount.tokenData.authorizationToken}`,
          }
        : {}),
    },
    body: JSON.stringify(body),
  }).then((response) => response.json() as Promise<unknown>);
}

export function GET(url: string, sp: URLSearchParams, token?: boolean) {
  return fetch(`${url}?${sp.toString()}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(token
        ? {
            "Auth-Token": `Bearer ${adminAccount.tokenData.authorizationToken}`,
          }
        : {}),
    },
  }).then((response) => {
    if (response.status !== 200) throw new Error("Failed to fetch");
    return response.json() as Promise<unknown>;
  });
}
