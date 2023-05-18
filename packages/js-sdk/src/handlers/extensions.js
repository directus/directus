/**
 * Settings handler
 */
export class ExtensionEndpoint {
    constructor(transport, name) {
        this.name = name;
        this.transport = transport;
    }
    endpoint(path) {
        if (path.startsWith('/')) {
            path = path.substr(1);
        }
        return `/custom/${this.name}/${path}`;
    }
    get(path, options) {
        return this.transport.get(this.endpoint(path), options);
    }
    head(path, options) {
        return this.transport.head(this.endpoint(path), options);
    }
    options(path, options) {
        return this.transport.options(this.endpoint(path), options);
    }
    delete(path, data, options) {
        return this.transport.delete(this.endpoint(path), data, options);
    }
    post(path, data, options) {
        return this.transport.post(this.endpoint(path), data, options);
    }
    put(path, data, options) {
        return this.transport.put(this.endpoint(path), data, options);
    }
    patch(path, data, options) {
        return this.transport.patch(this.endpoint(path), data, options);
    }
}
export class ExtensionHandler {
    constructor(transport) {
        this.transport = transport;
    }
    endpoint(name) {
        return new ExtensionEndpoint(this.transport, name);
    }
}
