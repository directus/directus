import { Client } from "./client";
/**
 * Expected type definition of a paginator.
 */
export declare type Paginator<T> = AsyncGenerator<T, T, unknown>;
/**
 * Expected paginator configuration passed to an operation. Services will extend
 * this interface definition and may type client further.
 */
export interface PaginationConfiguration {
    client: Client<any, any, any>;
    pageSize?: number;
    startingToken?: any;
}
