import type { CoreCollection } from "../index.js";
import type { DirectusUser } from "./user.js";

export type DirectusDashboard<Schema extends object> = CoreCollection<Schema, 'directus_dashboards', {
    id: string;
    name: string;
    icon: string;
    note: string;
    date_created: string;
    user_created: DirectusUser<Schema> | string;
    color: string;
}>;
