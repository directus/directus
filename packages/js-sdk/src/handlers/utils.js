/**
 * Utils handler
 */
export class UtilsHandler {
    constructor(transport) {
        this.random = {
            string: async (length = 32) => {
                const result = await this.transport.get('/utils/random/string', { params: { length } });
                return result.data;
            },
        };
        this.hash = {
            generate: async (string) => {
                const result = await this.transport.post('/utils/hash/generate', { string });
                return result.data;
            },
            verify: async (string, hash) => {
                const result = await this.transport.post('/utils/hash/verify', { string, hash });
                return result.data;
            },
        };
        this.transport = transport;
    }
    async sort(collection, item, to) {
        await this.transport.post(`/utils/sort/${encodeURI(collection)}`, { item, to });
    }
    async revert(revision) {
        await this.transport.post(`/utils/revert/${encodeURI(revision)}`);
    }
}
