import type { CoreCollection } from "../index.js";

export type DirectusRole<Schema extends object> = CoreCollection<Schema, 'directus_roles', {
    id: string;
    name: string;
    icon: string;
    description: string;
    ip_access: string;
    enforce_tfa: boolean;
    admin_access: boolean;
    app_access: boolean;
}>;
