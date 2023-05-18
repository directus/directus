export class PasswordsHandler {
    constructor(transport) {
        this.transport = transport;
    }
    async request(email, reset_url) {
        await this.transport.post('/auth/password/request', { email, reset_url });
    }
    async reset(token, password) {
        await this.transport.post('/auth/password/reset', { token, password });
    }
}
