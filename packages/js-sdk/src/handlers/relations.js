/**
 * Relations handler
 */
import { EmptyParamError } from '../items';
export class RelationsHandler {
    constructor(transport) {
        this.transport = transport;
    }
    async readOne(collection, id) {
        if (`${collection}` === '')
            throw new EmptyParamError('collection');
        if (`${id}` === '')
            throw new EmptyParamError('id');
        const response = await this.transport.get(`/relations/${collection}/${id}`);
        return response.data;
    }
    async readMany(collection) {
        if (`${collection}` === '')
            throw new EmptyParamError('collection');
        const response = await this.transport.get(`/relations/${collection}`);
        return response.data;
    }
    async readAll() {
        const response = await this.transport.get(`/relations`);
        return response.data;
    }
    async createOne(item) {
        return (await this.transport.post(`/relations`, item)).data;
    }
    async updateOne(collection, field, item) {
        if (`${collection}` === '')
            throw new EmptyParamError('collection');
        if (`${field}` === '')
            throw new EmptyParamError('field');
        return (await this.transport.patch(`/relations/${collection}/${field}`, item)).data;
    }
    async deleteOne(collection, field) {
        if (`${collection}` === '')
            throw new EmptyParamError('collection');
        if (`${field}` === '')
            throw new EmptyParamError('field');
        await this.transport.delete(`/relations/${collection}/${field}`);
    }
}
