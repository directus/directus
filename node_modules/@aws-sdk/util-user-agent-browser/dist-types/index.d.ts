import { Provider, UserAgent } from "@aws-sdk/types";
import { DefaultUserAgentOptions } from "./configurations";
/**
 * Default provider to the user agent in browsers. It's a best effort to infer
 * the device information. It uses bowser library to detect the browser and version
 */
export declare const defaultUserAgent: ({ serviceId, clientVersion }: DefaultUserAgentOptions) => Provider<UserAgent>;
