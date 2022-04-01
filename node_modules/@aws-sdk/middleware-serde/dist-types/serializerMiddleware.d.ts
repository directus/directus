import { EndpointBearer, RequestSerializer, SerializeMiddleware } from "@aws-sdk/types";
export declare const serializerMiddleware: <Input extends object, Output extends object, RuntimeUtils extends EndpointBearer>(options: RuntimeUtils, serializer: RequestSerializer<any, RuntimeUtils>) => SerializeMiddleware<Input, Output>;
