import { SourceProfileInit } from "@aws-sdk/shared-ini-file-loader";
import { Profile, Provider } from "@aws-sdk/types";
export interface SharedConfigInit extends SourceProfileInit {
    /**
     * The preferred shared ini file to load the config. "config" option refers to
     * the shared config file(defaults to `~/.aws/config`). "credentials" option
     * refers to the shared credentials file(defaults to `~/.aws/credentials`)
     */
    preferredFile?: "config" | "credentials";
}
export declare type GetterFromConfig<T> = (profile: Profile) => T | undefined;
/**
 * Get config value from the shared config files with inferred profile name.
 */
export declare const fromSharedConfigFiles: <T = string>(configSelector: GetterFromConfig<T>, { preferredFile, ...init }?: SharedConfigInit) => Provider<T>;
