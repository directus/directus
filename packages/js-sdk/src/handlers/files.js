/**
 * Files handler
 */
import { ItemsHandler } from '../base/items';
export class FilesHandler extends ItemsHandler {
    constructor(transport) {
        super('directus_files', transport);
    }
    async import(body) {
        const response = await this.transport.post(`/files/import`, body);
        return response.data;
    }
}
