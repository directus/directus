import { Profile } from "@aws-sdk/types";
import { SsoProfile } from "./types";
/**
 * @internal
 */
export declare const isSsoProfile: (arg: Profile) => arg is Partial<SsoProfile>;
