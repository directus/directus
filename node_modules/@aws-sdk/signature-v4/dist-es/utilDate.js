export var iso8601 = function (time) {
    return toDate(time)
        .toISOString()
        .replace(/\.\d{3}Z$/, "Z");
};
export var toDate = function (time) {
    if (typeof time === "number") {
        return new Date(time * 1000);
    }
    if (typeof time === "string") {
        if (Number(time)) {
            return new Date(Number(time) * 1000);
        }
        return new Date(time);
    }
    return time;
};
