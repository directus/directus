import { toArray } from '@directus/utils';
import { useLogger } from '../../logger/index.js';
import type { Request } from 'express';
import { InvalidPayloadError } from '@directus/errors';
import { useEnv } from '@directus/env';

/**
 * Checks if the defined redirect after successful SSO login is in the allow list
 */
export function isLoginOriginRedirectAllowed(req: Request, provider: string): boolean {
  const logger = useLogger();
  const env = useEnv();
  const originUrl = `${req.protocol}://${req.get('host')}`;

  let origin: URL;

  try {
    origin = new URL(originUrl);
  } catch {
    logger.warn(`[${provider}] Invalid origin from request: ${originUrl}`);
    throw new InvalidPayloadError({ reason: 'Invalid origin URL' });
  }

  logger.debug(`[${provider}] Request origin: ${origin.origin}`);

  const envKey = `AUTH_${provider.toUpperCase()}_REDIRECT_ALLOW_LIST`;

  if (envKey in env) {
    return toArray(env[envKey] as string).findIndex((domain) => {
      try {
        const url = new URL(domain);

        return url.hostname === origin.hostname
      } catch {
        logger.warn(`[${provider}] Invalid domain in ${envKey}: ${domain}`);

        return false
      }
    }) !== -1;
  }

  return false;
}
