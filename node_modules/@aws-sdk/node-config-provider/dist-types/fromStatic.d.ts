import { Provider } from "@aws-sdk/types";
export declare type FromStaticConfig<T> = T | (() => T) | Provider<T>;
export declare const fromStatic: <T>(defaultValue: FromStaticConfig<T>) => Provider<T>;
