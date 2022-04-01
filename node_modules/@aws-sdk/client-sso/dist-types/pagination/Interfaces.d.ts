import { PaginationConfiguration } from "@aws-sdk/types";
import { SSO } from "../SSO";
import { SSOClient } from "../SSOClient";
export interface SSOPaginationConfiguration extends PaginationConfiguration {
    client: SSO | SSOClient;
}
