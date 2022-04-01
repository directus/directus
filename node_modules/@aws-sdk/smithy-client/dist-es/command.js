import { constructStack } from "@aws-sdk/middleware-stack";
var Command = (function () {
    function Command() {
        this.middlewareStack = constructStack();
    }
    return Command;
}());
export { Command };
