import type { Credentials, Options, ProviderType } from './types/index.js';
import type { DeploymentDriver } from './deployment/deployment.js';
import { VercelDriver } from './deployment/drivers/index.js';

// Driver constructor type - uses any for credentials to allow provider-specific types
type DriverConstructor = new (credentials: any, options?: Options) => DeploymentDriver;

/**
 * Registry of deployment driver constructors
 */
const drivers: Map<ProviderType, DriverConstructor> = new Map();

// Register drivers
drivers.set('vercel', VercelDriver);
// drivers.set('netlify', NetlifyDriver);

/**
 * Get a deployment driver instance
 *
 * @param type Provider type (vercel, netlify, aws, etc.)
 * @param credentials Provider credentials (decrypted from DB)
 * @param options Additional provider options
 * @returns Deployment driver instance
 * @throws Error if driver type is not supported
 */
export function getDeploymentDriver(
  type: ProviderType,
  credentials: Credentials,
  options?: Options,
): DeploymentDriver {
  const Driver = drivers.get(type);

  if (!Driver) {
    throw new Error(`Deployment driver "${type}" is not supported`);
  }

  return new Driver(credentials, options);
}

/**
 * Check if a provider type is supported
 */
export function isValidProviderType(type: string): type is ProviderType {
  return drivers.has(type as ProviderType);
}

/**
 * Get list of supported provider types
 */
export function getSupportedProviderTypes(): ProviderType[] {
  return Array.from(drivers.keys());
}

