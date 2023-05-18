/**
 * Folders handler
 */
import { ItemsHandler } from '../base/items';
export class FoldersHandler extends ItemsHandler {
    constructor(transport) {
        super('directus_folders', transport);
    }
}
