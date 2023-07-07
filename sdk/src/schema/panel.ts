import type { CoreCollection } from "../index.js";
import type { DirectusUser } from "./user.js";
import type { DirectusDashboard } from "./dashboard.js";

export type DirectusPanel<Schema extends object> = CoreCollection<Schema, 'directus_panels', {
    id: string;
    dashboard: DirectusDashboard<Schema> | string;
    name: string;
    icon: string;
    color: string;
    show_header: boolean;
    note: string;
    type: string;
    position_x: number;
    position_y: number;
    width: number;
    height: number;
    options: Record<string, any> | null;
    date_created: string;
    user_created: DirectusUser<Schema> | string;
}>;
