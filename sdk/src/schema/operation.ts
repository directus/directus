import type { CoreCollection } from "../index.js";
import type { DirectusFlow } from "./flow.js";
import type { DirectusUser } from "./user.js";

export type DirectusOperation<Schema extends object> = CoreCollection<Schema, 'directus_operations', {
    id: string;
    name: string;
    key: string;
    type: string;
    position_x: number;
    position_y: number;
    timestamp: string;
    options: Record<string, any> | null;
    resolve: DirectusOperation<Schema> | string;
    reject: DirectusOperation<Schema> | string;
    flow: DirectusFlow<Schema> | string;
    date_created: string;
    user_created: DirectusUser<Schema> | string;
}>;
