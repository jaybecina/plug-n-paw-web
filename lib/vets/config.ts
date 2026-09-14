export function getGeoapifyApiKey() {
  const apiKey = process.env.GEOAPIFY_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("GEOAPIFY_API_KEY is not configured");
  }

  return apiKey;
}

