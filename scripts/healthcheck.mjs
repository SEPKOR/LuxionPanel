const port = process.env.PORT || "3000";
const host = process.env.LUXION_PUBLIC_URL || `http://127.0.0.1:${port}`;
const url = new URL("/api/v1/health", host);

const response = await fetch(url);
if (!response.ok) {
  console.error(`Health check failed: ${response.status}`);
  process.exit(1);
}
