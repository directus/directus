import type { CoreCollection } from "../index.js";
import type { DirectusRole } from './role.js';
import type { DirectusUser } from "./user.js";



export type DirectusRelation<Schema extends object> = CoreCollection<Schema, 'directus_relations', {
}>;
