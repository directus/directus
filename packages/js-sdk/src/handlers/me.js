import { TFAHandler } from './tfa';
export class MeHandler {
    constructor(transport) {
        this._transport = transport;
    }
    get tfa() {
        return this._tfa || (this._tfa = new TFAHandler(this._transport));
    }
    async read(query) {
        const response = await this._transport.get('/users/me', {
            params: query,
        });
        return response.data;
    }
    async update(data, query) {
        const response = await this._transport.patch(`/users/me`, data, {
            params: query,
        });
        return response.data;
    }
}
