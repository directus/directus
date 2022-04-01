import { HeaderBag } from "@aws-sdk/types";
import { IncomingHttpHeaders } from "http2";
declare const getTransformedHeaders: (headers: IncomingHttpHeaders) => HeaderBag;
export { getTransformedHeaders };
