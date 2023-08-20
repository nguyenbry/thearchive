const BASE_URL = "https://sneakerconsign.com/api";

export function getFullUrl(path: `/${string}`) {
  return `${BASE_URL}${path}`;
}

export const SNEAKER_CONSIGN_URLS = {
  SIGN_IN: getFullUrl("/signin"),
  TWO_FACTOR_AUTH: getFullUrl("/checkverification"),
  SOLD: getFullUrl("/getsold"),
  STORE_HOME: getFullUrl("/getstorehome"),
  LISTING: getFullUrl("/getlisting"),
};

export function proceedsToPayout(proceeds: number) {
  return proceeds * (1 - 0.029);
}
