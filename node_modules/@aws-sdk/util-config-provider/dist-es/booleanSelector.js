export var SelectorType;
(function (SelectorType) {
    SelectorType["ENV"] = "env";
    SelectorType["CONFIG"] = "shared config entry";
})(SelectorType || (SelectorType = {}));
export var booleanSelector = function (obj, key, type) {
    if (!(key in obj))
        return undefined;
    if (obj[key] === "true")
        return true;
    if (obj[key] === "false")
        return false;
    throw new Error("Cannot load ".concat(type, " \"").concat(key, "\". Expected \"true\" or \"false\", got ").concat(obj[key], "."));
};
