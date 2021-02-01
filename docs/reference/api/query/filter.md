# Filter

Used to search items in a collection that matches the filter's conditions. Filters follow the syntax
`filter[<field-name>][<operator>]=<value>`.

#### Filter Operators

| Operator     | Description                               |
| ------------ | ----------------------------------------- |
| `_eq`        | Equal to                                  |
| `_neq`       | Not equal to                              |
| `_lt`        | Less than                                 |
| `_lte`       | Less than or equal to                     |
| `_gt`        | Greater than                              |
| `_gte`       | Greater than or equal to                  |
| `_in`        | Exists in one of the values               |
| `_nin`       | Not in one of the values                  |
| `_null`      | It is null                                |
| `_nnull`     | It is not null                            |
| `_contains`  | Contains the substring                    |
| `_ncontains` | Doesn't contain the substring             |
| `_rlike`     | Contains a substring using a wildcard     |
| `_nrlike`    | Not contains a substring using a wildcard |
| `_between`   | The value is between two values           |
| `_nbetween`  | The value is not between two values       |
| `_empty`     | The value is empty (null or falsy)        |
| `_nempty`    | The value is not empty (null or falsy)    |
| `_all`       | Contains all given related item's IDs     |
| `_has`       | Has one or more related items's IDs       |

#### Filter: Relational

You can filter by relational values by appending the field names in nested sections in the parameter, as follows:

`?filter[author][name][_eq]=Rijk`

#### Filtering using JSON

The `filter` parameter supports the full [Filter Rules](/reference/filter-rules) syntax. As a matter of fact, the
standard array-like syntax is parsed to an object in execution. This means that you can also pass filter rules as a JSON
object in the parameter directly:

```
?filter={ "status": { "_eq": "active" }}
```

#### AND vs OR

See [Filter Rules](/reference/filter-rules) for more information on how to nest logical operations in a filter.
