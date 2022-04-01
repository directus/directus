import { DeserializeMiddleware, ResponseDeserializer } from "@aws-sdk/types";
export declare const deserializerMiddleware: <Input extends object, Output extends object, RuntimeUtils = any>(options: RuntimeUtils, deserializer: ResponseDeserializer<any, any, RuntimeUtils>) => DeserializeMiddleware<Input, Output>;
