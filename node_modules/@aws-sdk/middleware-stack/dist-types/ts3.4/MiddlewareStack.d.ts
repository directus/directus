import { MiddlewareStack } from "@aws-sdk/types";
export declare const constructStack: <Input extends object, Output extends object>() => MiddlewareStack<Input, Output>;
