import "server-only";

const OXYLABS_REALTIME_URL = "https://realtime.oxylabs.io/v1/queries";

type OxylabsResponse = {
  results?: Array<{
    content: string;
    status_code?: number;
    url?: string;
  }>;
};

function getAuthHeader(): string {
  const apiKey = process.env.OXYLABS_WEB_API_KEY;
  if (apiKey) {
    return `Bearer ${apiKey.trim()}`;
  }

  const username = process.env.OXY_WSA_USERNAME;
  const password = process.env.OXY_WSA_PASSWORD;
  if (username && password) {
    const credentials = Buffer.from(`${username}:${password}`).toString("base64");
    return `Basic ${credentials}`;
  }

  throw new Error(
    "Missing Oxylabs credentials: set OXYLABS_WEB_API_KEY (recommended) or OXY_WSA_USERNAME and OXY_WSA_PASSWORD in environment variables.",
  );
}

export async function fetchHtmlViaOxylabs(targetUrl: string): Promise<string> {
  const authHeader = getAuthHeader();

  const response = await fetch(OXYLABS_REALTIME_URL, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source: "universal",
      url: targetUrl,
      render: "html",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Oxylabs request failed (${response.status} ${response.statusText}): ${errorText.slice(0, 300)}`,
    );
  }

  const data = (await response.json()) as OxylabsResponse;

  if (!data.results || data.results.length === 0 || !data.results[0].content) {
    throw new Error(`Oxylabs returned empty content for URL: ${targetUrl}`);
  }

  return data.results[0].content;
}

