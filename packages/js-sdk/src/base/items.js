import { EmptyParamError, } from '../items';
export class ItemsHandler {
    constructor(collection, transport) {
        this.collection = collection;
        this.transport = transport;
        this.endpoint = collection.startsWith('directus_') ? `/${collection.substring(9)}` : `/items/${collection}`;
    }
    async readOne(id, query, options) {
        if (`${id}` === '')
            throw new EmptyParamError('id');
        const response = await this.transport.get(`${this.endpoint}/${encodeURI(id)}`, {
            params: query,
            ...options === null || options === void 0 ? void 0 : options.requestOptions,
        });
        return response.data;
    }
    async readMany(ids, query, options) {
        var _a;
        const collectionFields = await this.transport.get(`/fields/${this.collection}`);
        const primaryKeyField = (_a = collectionFields.data) === null || _a === void 0 ? void 0 : _a.find((field) => field.schema.is_primary_key === true);
        const { data, meta } = await this.transport.get(`${this.endpoint}`, {
            params: {
                ...query,
                filter: {
                    [primaryKeyField.field]: { _in: ids },
                    ...query === null || query === void 0 ? void 0 : query.filter,
                },
                sort: (query === null || query === void 0 ? void 0 : query.sort) || primaryKeyField.field,
            },
            ...options === null || options === void 0 ? void 0 : options.requestOptions,
        });
        return {
            data,
            ...(meta && { meta }),
        };
    }
    async readByQuery(query, options) {
        const { data, meta } = await this.transport.get(`${this.endpoint}`, {
            params: query,
            ...options === null || options === void 0 ? void 0 : options.requestOptions,
        });
        return {
            data,
            ...(meta && { meta }),
        };
    }
    async createOne(item, query, options) {
        return (await this.transport.post(`${this.endpoint}`, item, {
            params: query,
            ...options === null || options === void 0 ? void 0 : options.requestOptions,
        })).data;
    }
    async createMany(items, query, options) {
        return await this.transport.post(`${this.endpoint}`, items, {
            params: query,
            ...options === null || options === void 0 ? void 0 : options.requestOptions,
        });
    }
    async updateOne(id, item, query, options) {
        if (`${id}` === '')
            throw new EmptyParamError('id');
        return (await this.transport.patch(`${this.endpoint}/${encodeURI(id)}`, item, {
            params: query,
            ...options === null || options === void 0 ? void 0 : options.requestOptions,
        })).data;
    }
    async updateMany(ids, data, query, options) {
        return await this.transport.patch(`${this.endpoint}`, {
            keys: ids,
            data,
        }, {
            params: query,
            ...options === null || options === void 0 ? void 0 : options.requestOptions,
        });
    }
    async updateBatch(items, query, options) {
        return await this.transport.patch(`${this.endpoint}`, items, {
            params: query,
            ...options === null || options === void 0 ? void 0 : options.requestOptions,
        });
    }
    async updateByQuery(updateQuery, data, query, options) {
        return await this.transport.patch(`${this.endpoint}`, {
            query: updateQuery,
            data,
        }, {
            params: query,
            ...options === null || options === void 0 ? void 0 : options.requestOptions,
        });
    }
    async deleteOne(id, options) {
        if (`${id}` === '')
            throw new EmptyParamError('id');
        await this.transport.delete(`${this.endpoint}/${encodeURI(id)}`, undefined, options === null || options === void 0 ? void 0 : options.requestOptions);
    }
    async deleteMany(ids, options) {
        await this.transport.delete(`${this.endpoint}`, ids, options === null || options === void 0 ? void 0 : options.requestOptions);
    }
}
