export class GraphQLHandler {
    constructor(transport) {
        this.transport = transport;
    }
    async request(base, query, variables) {
        return await this.transport.post(base, {
            query,
            variables: typeof variables === 'undefined' ? {} : variables,
        });
    }
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    async items(query, variables) {
        return await this.request('/graphql', query, variables);
    }
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    async system(query, variables) {
        return await this.request('/graphql/system', query, variables);
    }
}
