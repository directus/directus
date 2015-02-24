define("handlebars", (function (global) {
    return function () {
        return global.Handlebars || Handlebars;
    };
}(this)));