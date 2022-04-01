import { Credentials } from "@aws-sdk/types";
export interface InstanceMetadataCredentials extends Credentials {
    readonly originalExpiration?: Date;
}
