import type { CoreCollection } from "../index.js";
import type { DirectusUser } from "./user.js";
import type { DirectusOperation } from "./operation.js";

export type DirectusFlow<Schema extends object> = CoreCollection<Schema, 'directus_flows', {
    id: string;
    name: string;
    icon: string;
    color: string;
    description: string;
    status: string;
    trigger: string;
    accountability: string;
    options: Record<string, any> | null;
    operation: DirectusOperation<Schema> | string;
    date_created: string;
    user_created: DirectusUser<Schema> | string;
}>;
