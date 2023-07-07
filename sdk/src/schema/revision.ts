import type { CoreCollection } from "../index.js";
import type { DirectusActivity } from "./activity.js";

export type DirectusRevision<Schema extends object> = CoreCollection<Schema, 'directus_revisions', {
    id: number;
    activity: DirectusActivity<Schema> | number;
    collection: string;
    item: string;
    data: Record<string, any> | null;
    delta: Record<string, any> | null;
    parent: DirectusRevision<Schema> | number | null;
}>;
