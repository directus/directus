# Limit

Using `limit` can be set the maximum number of items that will be returned. You can also use `-1` to return all items,
bypassing the default limits. The default limit is set to 100.

## Examples

```
# Returns a maximum of 10 items
?limit=10

# Returns an unlimited number of items
?limit=-1
```

<!-- prettier-ignore-start -->
::: warning
Fetching unlimited data may result in degraded performance or timeouts, use with caution.
:::
<!-- prettier-ignore-end -->
