import { MaybeRef } from 'vue';

export type Collection = MaybeRef<string>;

export type PrimaryKey = MaybeRef<string | null>;

export type IsNew = MaybeRef<boolean>;
