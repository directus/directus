export class InvitesHandler {
    constructor(transport) {
        this.transport = transport;
    }
    async send(email, role, invite_url) {
        await this.transport.post('/users/invite', {
            email,
            role,
            invite_url,
        });
    }
    async accept(token, password) {
        await this.transport.post(`/users/invite/accept`, {
            token,
            password,
        });
    }
}
