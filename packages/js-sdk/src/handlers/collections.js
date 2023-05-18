/**
 * Collections handler
 */
import { EmptyParamError } from '../items';
export class CollectionsHandler {
    constructor(transport) {
        this.transport = transport;
    }
    async readOne(collection) {
        if (`${collection}` === '')
            throw new EmptyParamError('collection');
        const response = await this.transport.get(`/collections/${collection}`);
        return response.data;
    }
    async readAll() {
        const { data, meta } = await this.transport.get(`/collections`);
        return {
            data,
            meta,
        };
    }
    async createOne(collection) {
        return (await this.transport.post(`/collections`, collection)).data;
    }
    async createMany(collections) {
        const { data, meta } = await this.transport.post(`/collections`, collections);
        return {
            data,
            meta,
        };
    }
    async updateOne(collection, item, query) {
        if (`${collection}` === '')
            throw new EmptyParamError('collection');
        return (await this.transport.patch(`/collections/${collection}`, item, {
            params: query,
        })).data;
    }
    async deleteOne(collection) {
        if (`${collection}` === '')
            throw new EmptyParamError('collection');
        await this.transport.delete(`/collections/${collection}`);
    }
}
