import type { CoreCollection } from "../index.js";
import type { DirectusUser } from "./user.js";

export type DirectusNotification<Schema extends object> = CoreCollection<Schema, 'directus_notifications', {
    id: string;
    timestamp: string;
    status: string;
    recipient: DirectusUser<Schema> | string;
    sender: DirectusUser<Schema> | string;
    subject: string;
    message: string;
    collection: string;
    item: string;
}>;
