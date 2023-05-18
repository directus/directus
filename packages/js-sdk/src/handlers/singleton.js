export class SingletonHandler {
    constructor(collection, transport) {
        this.collection = collection;
        this.transport = transport;
        this.endpoint = collection.startsWith('directus_') ? `/${collection.substring(9)}` : `/items/${collection}`;
    }
    async read(query) {
        const item = await this.transport.get(`${this.endpoint}`, {
            params: query,
        });
        return item.data;
    }
    async update(data, _query) {
        const item = await this.transport.patch(`${this.endpoint}`, data, {
            params: _query,
        });
        return item.data;
    }
}
