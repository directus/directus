import { toArray } from "./to-array";

const DOMAIN_REGEX = /\/\/(.*?)\//;

/**
 * Check if url matches white list either exactly or by domain
 */
export default function isUrlAllowed(url: string, allowList: string | string[]): boolean {
  const urlWhitelist = toArray(allowList) as unknown as any[];

  if (!url) return true;
  if (urlWhitelist.includes(url)) return true;
  if (urlWhitelist.includes(url.match(DOMAIN_REGEX)?.[1])) return true;

  return false;
}