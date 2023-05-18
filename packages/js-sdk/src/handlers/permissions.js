/**
 * Permissions handler
 */
import { ItemsHandler } from '../base/items';
export class PermissionsHandler extends ItemsHandler {
    constructor(transport) {
        super('directus_permissions', transport);
    }
}
