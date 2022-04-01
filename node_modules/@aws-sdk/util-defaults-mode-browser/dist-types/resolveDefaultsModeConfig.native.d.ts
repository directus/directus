import type { DefaultsMode, ResolvedDefaultsMode } from "@aws-sdk/smithy-client";
import type { Provider } from "@aws-sdk/types";
/**
 * @internal
 */
export interface ResolveDefaultsModeConfigOptions {
    defaultsMode?: DefaultsMode | Provider<DefaultsMode>;
}
/**
 * Validate the defaultsMode configuration. If the value is set to "auto", it
 * resolves the value to "mobile".
 *
 * @default "legacy"
 * @internal
 */
export declare const resolveDefaultsModeConfig: ({ defaultsMode, }?: ResolveDefaultsModeConfigOptions) => Provider<ResolvedDefaultsMode>;
