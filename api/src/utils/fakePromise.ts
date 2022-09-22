export function fakePromise<T extends object>(value: T): T {
    return new Proxy(value, {
        get: function (target, name) {

            if(name === 'then') {
                return Promise.resolve((callback: (data: T) => void) => {
                    callback(target);
                })
            }

            if(name === '$run') {
                return target;
            }

            if(name === '$debug') {
                return 'Test is working!'
            }

            const returnValue = Reflect.get(target, name)

            if(typeof returnValue === 'function') {
                return (...args: any[]) => {
                    const result = returnValue.apply(target, args);
                    if(typeof result === 'object' && 'then' in result)
                        return fakePromise(result)
                    return result
                };
            }
            
            return returnValue;
        }
    })
}