import { createError } from '@directus/errors';

export interface MethodNotAllowedErrorExtensions {
   allowed: string[];
   current: string;
}

export const messageConstructor = (extensions: MethodNotAllowedErrorExtensions) => `Invalid method "${extensions.current}" used. Should be one of ${extensions.allowed.map((method) => `"${method}"`).join(', ')}.`;

export const MethodNotAllowedError = createError<MethodNotAllowedErrorExtensions>('METHOD_NOT_ALLOWED', messageConstructor, 405);
