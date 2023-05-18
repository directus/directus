/**
 * Fields handler
 */
import { EmptyParamError } from '../items';
export class FieldsHandler {
    constructor(transport) {
        this.transport = transport;
    }
    async readOne(collection, id) {
        if (`${collection}` === '')
            throw new EmptyParamError('collection');
        if (`${id}` === '')
            throw new EmptyParamError('id');
        const response = await this.transport.get(`/fields/${collection}/${id}`);
        return response.data;
    }
    async readMany(collection) {
        if (`${collection}` === '')
            throw new EmptyParamError('collection');
        const response = await this.transport.get(`/fields/${collection}`);
        return {
            data: response.data,
            meta: undefined,
        };
    }
    async readAll() {
        const response = await this.transport.get(`/fields`);
        return {
            data: response.data,
            meta: undefined,
        };
    }
    async createOne(collection, item) {
        if (`${collection}` === '')
            throw new EmptyParamError('collection');
        return (await this.transport.post(`/fields/${collection}`, item)).data;
    }
    async updateOne(collection, field, item) {
        if (`${collection}` === '')
            throw new EmptyParamError('collection');
        if (`${field}` === '')
            throw new EmptyParamError('field');
        return (await this.transport.patch(`/fields/${collection}/${field}`, item)).data;
    }
    async deleteOne(collection, field) {
        if (`${collection}` === '')
            throw new EmptyParamError('collection');
        if (`${field}` === '')
            throw new EmptyParamError('field');
        await this.transport.delete(`/fields/${collection}/${field}`);
    }
}
