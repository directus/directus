/**
 * Revisions handler
 */
import { ItemsHandler } from '../base/items';
export class RevisionsHandler extends ItemsHandler {
    constructor(transport) {
        super('directus_revisions', transport);
    }
}
