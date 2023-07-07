import type { CoreCollection } from "../index.js";

export type DirectusFolder<Schema extends object> = CoreCollection<Schema, 'directus_folders', {
    id: string;
    name: string;
    parent: DirectusFolder<Schema> | string;
}>;
