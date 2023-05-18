/**
 * Server handler
 */
export class ServerHandler {
    constructor(transport) {
        this.transport = transport;
    }
    async ping() {
        return (await this.transport.get('/server/ping')).raw;
    }
    async info() {
        return (await this.transport.get('/server/info')).data;
    }
    async oas() {
        return (await this.transport.get('/server/specs/oas')).raw;
    }
}
