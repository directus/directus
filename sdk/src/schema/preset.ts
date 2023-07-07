import type { CoreCollection } from "../index.js";
import type { DirectusRole } from './role.js';
import type { DirectusUser } from "./user.js";

export type DirectusPreset<Schema extends object> = CoreCollection<Schema, 'directus_presets', {
    id: number;
    bookmark: string;
    user: DirectusUser<Schema> | string;
    role: DirectusRole<Schema> | string;
    collection: string;
    search: string;
    layout: string;
    layout_query: Record<string, any> | null;
    layout_options: Record<string, any> | null;
    refresh_interval: number;
    filter: Record<string, any> | null;
    icon: string;
    color: string;
}>;
