---
editLink: false
---

# Function: graphql()

> **graphql**(): \<Schema\>(`client`) => [`GraphqlClient`](../interfaces/interface.GraphqlClient.md)\< `Schema` \>

Creates a client to communicate with Directus GraphQL.

## Returns

A Directus GraphQL client.

> > \<`Schema`\>(`client`): [`GraphqlClient`](../interfaces/interface.GraphqlClient.md)\< `Schema` \>
>
> ### Type parameters
>
> | Parameter                   |
> | :-------------------------- |
> | `Schema` _extends_ `object` |
>
> ### Parameters
>
> | Parameter | Type                                                                                   |
> | :-------- | :------------------------------------------------------------------------------------- |
> | `client`  | [`DirectusClient`](../../types-1/interfaces/interface.DirectusClient.md)\< `Schema` \> |
>
> ### Returns
>
> [`GraphqlClient`](../interfaces/interface.GraphqlClient.md)\< `Schema` \>
>
> ### Source
>
> [graphql/composable.ts:13](https://github.com/directus/directus/blob/7789a6c53/sdk/src/graphql/composable.ts#L13)

## Source

[graphql/composable.ts:12](https://github.com/directus/directus/blob/7789a6c53/sdk/src/graphql/composable.ts#L12)
