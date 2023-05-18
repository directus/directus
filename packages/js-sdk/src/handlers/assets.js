import { EmptyParamError } from '../items';
export class AssetsHandler {
    constructor(transport) {
        this.transport = transport;
    }
    async readOne(id) {
        if (`${id}` === '')
            throw new EmptyParamError('id');
        const response = await this.transport.get(`/assets/${id}`, {
            responseType: 'stream',
        });
        return response.raw;
    }
}
