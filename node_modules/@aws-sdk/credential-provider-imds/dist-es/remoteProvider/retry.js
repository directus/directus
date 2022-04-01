export var retry = function (toRetry, maxRetries) {
    var promise = toRetry();
    for (var i = 0; i < maxRetries; i++) {
        promise = promise.catch(toRetry);
    }
    return promise;
};
