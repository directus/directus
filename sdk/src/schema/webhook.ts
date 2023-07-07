import type { CoreCollection } from "../index.js";

export type DirectusWebhook<Schema extends object> = CoreCollection<Schema, 'directus_webhooks', {
    id: number;
    name: string;
    method: string;
    url: string;
    status: string;
    data: boolean;
    actions: string;
    collections: string;
    headers: Record<string, any> | null;
}>;
