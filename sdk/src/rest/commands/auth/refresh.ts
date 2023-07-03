import type { RestCommand } from "../../types.js";

/**
 * Auth refresh command
 */
export const refreshAuth = <Schema extends object>(refresh_token: string): RestCommand<Schema, any> => () => ({
    path: '/auth/refresh',
    method: 'POST',
    body: JSON.stringify({ refresh_token }),
});