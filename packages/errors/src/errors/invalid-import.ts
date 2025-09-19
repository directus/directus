import type { ImportErrorExtensions } from '@directus/types';
import { createError, ErrorCode } from '../index.js';

export type { ImportErrorExtensions };

export const messageConstructor = ({ reason }: ImportErrorExtensions) => `Invalid payload. ${reason}.`;

export const InvalidImportError = createError<ImportErrorExtensions>(
  ErrorCode.InvalidPayload, // Use same error code as InvalidPayloadError
  messageConstructor,
  400,
);

