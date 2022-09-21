export function fakePromise<T extends object>(value: T) {
    return Promise.resolve( new Proxy(value, {
        get: function (target, name) {

            if(name === 'then') {
                return Promise.resolve((callback: (data: T) => void) => {
                    callback(target);
                })
            }

            if(name === 'run') {
                return target;
            }
    
            return Reflect.get(target, name);
        }
    }))
}