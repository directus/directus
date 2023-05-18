export class IAuth {
    constructor() {
        this.mode = (typeof window === 'undefined' ? 'json' : 'cookie');
    }
}
