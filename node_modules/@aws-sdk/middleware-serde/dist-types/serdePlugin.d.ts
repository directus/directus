import { DeserializeHandlerOptions, EndpointBearer, MetadataBearer, Pluggable, RequestSerializer, ResponseDeserializer, SerializeHandlerOptions } from "@aws-sdk/types";
export declare const deserializerMiddlewareOption: DeserializeHandlerOptions;
export declare const serializerMiddlewareOption: SerializeHandlerOptions;
export declare function getSerdePlugin<InputType extends object, SerDeContext extends EndpointBearer, OutputType extends MetadataBearer>(config: SerDeContext, serializer: RequestSerializer<any, SerDeContext>, deserializer: ResponseDeserializer<OutputType, any, SerDeContext>): Pluggable<InputType, OutputType>;
