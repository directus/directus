import { MaybeRef } from 'vue';
import { PrimaryKey as PrimaryKeyOrig } from '@directus/types';

export type Collection = MaybeRef<string | null>;

export type PrimaryKey = MaybeRef<PrimaryKeyOrig | null>;

export type IsNew = MaybeRef<boolean>;
