/**
 * Roles handler
 */
import { ItemsHandler } from '../base/items';
export class RolesHandler extends ItemsHandler {
    constructor(transport) {
        super('directus_roles', transport);
    }
}
