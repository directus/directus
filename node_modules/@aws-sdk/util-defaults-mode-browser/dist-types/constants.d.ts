import type { DefaultsMode } from "@aws-sdk/smithy-client";
import type { Provider } from "@aws-sdk/types";
export declare const DEFAULTS_MODE_OPTIONS: string[];
/**
 * @internal
 */
export interface ResolveDefaultsModeConfigOptions {
    defaultsMode?: DefaultsMode | Provider<DefaultsMode>;
}
