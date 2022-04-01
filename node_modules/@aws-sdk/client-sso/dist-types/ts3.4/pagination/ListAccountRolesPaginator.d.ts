import { Paginator } from "@aws-sdk/types";
import { ListAccountRolesCommandInput, ListAccountRolesCommandOutput } from "../commands/ListAccountRolesCommand";
import { SSOPaginationConfiguration } from "./Interfaces";
export declare function paginateListAccountRoles(config: SSOPaginationConfiguration, input: ListAccountRolesCommandInput, ...additionalArguments: any): Paginator<ListAccountRolesCommandOutput>;
