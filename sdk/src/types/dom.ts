interface Body {
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Request/body) */
    readonly body: ReadableStream<Uint8Array> | null;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Request/bodyUsed) */
    readonly bodyUsed: boolean;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Request/arrayBuffer) */
    arrayBuffer(): Promise<ArrayBuffer>;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Request/blob) */
    blob(): Promise<Blob>;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Request/formData) */
    formData(): Promise<FormData>;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Request/json) */
    json(): Promise<any>;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Request/text) */
    text(): Promise<string>;
}

interface Response extends Body {
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Response/headers) */
    readonly headers: Headers;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Response/ok) */
    readonly ok: boolean;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Response/redirected) */
    readonly redirected: boolean;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Response/status) */
    readonly status: number;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Response/statusText) */
    readonly statusText: string;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Response/type) */
    readonly type: ResponseType;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Response/url) */
    readonly url: string;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Response/clone) */
    clone(): Response;
}

// eslint-disable-next-line no-var
declare var Response: {
    prototype: Response;
    new(body?: BodyInit | null, init?: ResponseInit): Response;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Response/error_static) */
    error(): Response;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Response/json_static) */
    json(data: any, init?: ResponseInit): Response;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Response/redirect_static) */
    redirect(url: string | URL, status?: number): Response;
};
