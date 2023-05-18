import { SingletonHandler } from './singleton';
export class SettingsHandler extends SingletonHandler {
    constructor(transport) {
        super('directus_settings', transport);
    }
}
