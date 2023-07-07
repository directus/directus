import type { CoreCollection } from "../index.js";
import type { DirectusRole } from "./role.js";
import type { DirectusUser } from "./user.js";

export type DirectusShare<Schema extends object> = CoreCollection<Schema, 'directus_shares', {
    id: string;
    name: string;
    collection: string;
    item: string;
    role: DirectusRole<Schema> | string;
    password: string;
    user_created: DirectusUser<Schema> | string;
    date_created: string;
    date_start: string;
    date_end: string;
    times_used: number;
    max_uses: number;
}>;
