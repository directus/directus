/**
 * Get the configured Node Environment (eg "production", "development", etc)
 */
export const getNodeEnv = (): string | undefined => process.env['NODE_ENV'];
