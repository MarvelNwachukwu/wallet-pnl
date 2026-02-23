/**
 * Builds the OG image URL for a wallet with required parameters.
 * Used by generateMetadata so shares get a dynamic image (or fallback to default).
 */

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    (typeof process.env.VERCEL_URL === "string"
      ? `https://${process.env.VERCEL_URL}`
      : "https://recon.marvellousnwachukwu.com")
  );
}

export function formatAddress(address: string): string {
  if (!address || !ADDRESS_RE.test(address)) return "";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function buildOgImageUrl(
  address: string,
  chain: string = "ethereum",
  options?: { cacheBust?: boolean }
): string {
  if (!address || !ADDRESS_RE.test(address)) {
    return `${getAppUrl()}/api/og`;
  }
  const url = new URL(`${getAppUrl()}/api/og`);
  url.searchParams.set("address", address.trim());
  url.searchParams.set("chain", chain.trim());
  if (options?.cacheBust) {
    url.searchParams.set("v", Date.now().toString());
  }
  return url.toString();
}
