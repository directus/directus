import { useEnv } from '@directus/env';
import { createError, ErrorCode } from '../index.js';
import {
  useEmitter,
} from '../injected-dependencies.js'
// import type { Request } from 'express';

import type {
  Accountability,
  PrimaryKey,
  Field,
  RawField,
  Type,
  Relation,
  // Collection, // Not the same Collection type as in services/collection.ts
} from '@directus/types';

import type { Collection } from '../../../../api/src/types/collection.js';

interface ForbiddenErrorExtensions {
	reason: string;
  values?:{ // Controllers
    collection?: string | undefined,
    req?: any,
    // req?: Request,
  }
  | { // Permissions
    accountability: Accountability | null,
    collection: string,
    field?: string | RawField | (Partial<Field> & { field: string; type: Type | null }),
    relation?: Partial<Relation>,
  }
  | { // Permissions many / batch
    accountability: Accountability | null,
    collections: Partial<Collection>[],
  }
  | { // validate keys
    collection: string,
    key: PrimaryKey,
  }
  | { // imports
    collection: string,
    mimetype: any,
  }
  | { // 404
    accountability?: Accountability | null,
    collection?: string,
    key?: PrimaryKey,
  }
  | { // Metrics controller
    header: string,
  }
  | { // TFA controller
    accountability: Accountability | null,
    user: PrimaryKey,
  }
}

export const messageConstructor = (ext: ForbiddenErrorExtensions | void) => {
	const defaultReason =  `You don't have permission to access this.`;

  const env = useEnv();
  console.info('env', env); // eslint-disable-line no-console

  const emitter = useEmitter();

  emitter?.emitAction(
    'permission.error',
    {
      defaultReason,
      values: ext && ext.values,
    },
    {
      database: null,
      schema: null,
      accountability: ext && ext.values && ('accountability' in ext.values ? ext.values.accountability : null),
    },
  );

	if (ext?.reason) return ext.reason;

	return defaultReason;
};

export const ForbiddenError = createError(ErrorCode.Forbidden, messageConstructor, 403);
