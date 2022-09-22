export function fakePromise<T extends object>(value: T): T {
    if(typeof value === 'object' && 'isFakePromise' in value) {
        return value;
    }

    return new Proxy(value, {
        get: function (target, name) {

            if(name === 'then') {
                return Promise.resolve((callback: (data: T) => void) => {
                    callback(target);
                })
            }

            if(name === '$run') {
                return async function() {
                    if((target as any).isFakePromise) {
                        return await (target as any).$run();
                    }

                    return await target;
                }
            }

            if(name === 'isFakePromise') {
                return true;
            }

            const returnValue = Reflect.get(target, name)

            if(typeof returnValue === 'function') {
                return (...args: any[]) => {
                    const result = returnValue.apply(target, args);
                    if(typeof result === 'object' && 'then' in result && !('isFakePromise' in result))
                        return fakePromise(result)
                    return result
                };
            }
            
            return returnValue;
        }
    })
}