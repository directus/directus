import axios from 'axios';
import { ITransport, TransportError } from '../transport';
/**
 * Transport implementation
 */
export class Transport extends ITransport {
    constructor(config) {
        var _a;
        super();
        this.config = config;
        this.axios = axios.create({
            baseURL: this.config.url,
            params: this.config.params,
            headers: this.config.headers,
            onUploadProgress: this.config.onUploadProgress,
            maxBodyLength: this.config.maxBodyLength,
            maxContentLength: this.config.maxContentLength,
            withCredentials: true,
        });
        if ((_a = this.config) === null || _a === void 0 ? void 0 : _a.beforeRequest)
            this.beforeRequest = this.config.beforeRequest;
    }
    async beforeRequest(config) {
        return config;
    }
    get url() {
        return this.config.url;
    }
    async request(method, path, data, options) {
        var _a, _b, _c, _d, _e;
        try {
            let config = {
                method,
                url: path,
                data: data,
                params: options === null || options === void 0 ? void 0 : options.params,
                headers: options === null || options === void 0 ? void 0 : options.headers,
                responseType: options === null || options === void 0 ? void 0 : options.responseType,
                onUploadProgress: options === null || options === void 0 ? void 0 : options.onUploadProgress,
            };
            config = await this.beforeRequest(config);
            const response = await this.axios.request(config);
            const content = {
                raw: response.data,
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                data: response.data.data,
                meta: response.data.meta,
                errors: response.data.errors,
            };
            if (response.data.errors) {
                throw new TransportError(null, content);
            }
            return content;
        }
        catch (err) {
            if (!err || err instanceof Error === false) {
                throw err;
            }
            if (axios.isAxiosError(err)) {
                const data = (_a = err.response) === null || _a === void 0 ? void 0 : _a.data;
                throw new TransportError(err, {
                    raw: (_b = err.response) === null || _b === void 0 ? void 0 : _b.data,
                    status: (_c = err.response) === null || _c === void 0 ? void 0 : _c.status,
                    statusText: (_d = err.response) === null || _d === void 0 ? void 0 : _d.statusText,
                    headers: (_e = err.response) === null || _e === void 0 ? void 0 : _e.headers,
                    data: data === null || data === void 0 ? void 0 : data.data,
                    meta: data === null || data === void 0 ? void 0 : data.meta,
                    errors: data === null || data === void 0 ? void 0 : data.errors,
                });
            }
            throw new TransportError(err);
        }
    }
    async get(path, options) {
        return await this.request('get', path, undefined, options);
    }
    async head(path, options) {
        return await this.request('head', path, undefined, options);
    }
    async options(path, options) {
        return await this.request('options', path, undefined, options);
    }
    async delete(path, data, options) {
        return await this.request('delete', path, data, options);
    }
    async put(path, data, options) {
        return await this.request('put', path, data, options);
    }
    async post(path, data, options) {
        return await this.request('post', path, data, options);
    }
    async patch(path, data, options) {
        return await this.request('patch', path, data, options);
    }
}
