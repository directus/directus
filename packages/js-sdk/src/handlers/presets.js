/**
 * Presets handler
 */
import { ItemsHandler } from '../base/items';
export class PresetsHandler extends ItemsHandler {
    constructor(transport) {
        super('directus_presets', transport);
    }
}
