const MAX_QUERY_LENGTH = 100;

export function parseFindVetParams(sp: URLSearchParams): {
  q?: string;
  locate: boolean;
} {
  const q = (sp.get("q") ?? "").trim().slice(0, MAX_QUERY_LENGTH);
  const locate = sp.get("locate") === "1";
  return q ? { q, locate } : { locate };
}
