export var isCrtAvailable = function () {
    try {
        if (typeof require === "function" && typeof module !== "undefined" && module.require && require("aws-crt")) {
            return ["md/crt-avail"];
        }
        return null;
    }
    catch (e) {
        return null;
    }
};
