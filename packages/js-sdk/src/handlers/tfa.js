export class TFAHandler {
    constructor(transport) {
        this.transport = transport;
    }
    async generate(password) {
        const result = await this.transport.post('/users/me/tfa/generate', { password });
        return result.data;
    }
    async enable(secret, otp) {
        await this.transport.post('/users/me/tfa/enable', { secret, otp });
    }
    async disable(otp) {
        await this.transport.post('/users/me/tfa/disable', { otp });
    }
}
