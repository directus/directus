# Internal RunAst Documentation

As the `runAst()` function is a crucial and complex part of Directus, this document intends to get you started by
providing a high level overview.

## AST

When a request is made through REST, GQL or WebSockets, we internally turn this request into an AST before this AST
get's translated into one or more SQL requests which are then send to the database.

On the root level of an AST is the root node which then references a list of child nodes. Each child node can be either
a primitive field (FieldNode), a relational field (M2ONode, O2MNode, A2MNode) or a function field (FunctionFieldNode).
Relational fields can also have additional children and nested queries.

### FieldNode

Describes a primitive field and is also a leaf node of the AST.

### Relational Fields

The M2ONode, O2MNode and A2MNode all will recursively call the `runAst()` function and the resulting data will then be
injected into the data of the level above.

### FunctionFieldNode

The only case where a function field node get's inserted into the ast, is for the count(o2m_relation) case, all other
functions are kept as FieldNode's with the name containing the function.

## RunAst()

The `runAst()` does translates the AST into an executable SQL request, requests the appropiate data from the database
and then returns a single or a list of items as the result.

### GetDBQuery()

The RootNode and relational fields have each their own query parameters. These parameters need to be applied to the SQL
query. This is done by the `getDBQuery()` function which internally uses `applyQuery()`.

<!-- TODO: Describe in larger detail what the GetDBQuery exactly does, i.e. why and when does it need an inner query, why does it sometimes call applyQuery() multiple times in different places -->

#### ApplyQuery()

`applyQuery()` takes the query and modifies the SQL request so that filters, sorts and all the other variants of query
parameters are applied.A special behaviour is filtering, sorting or other parameters on nested fields. To make this
possible, the `addJoin()` joins the required tables and then registers itself into the aliasMap so that the next time
the same collection should be joined, instead it will just reuse the already existing join.
