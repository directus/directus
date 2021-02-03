# Single

Using `single` the first element will be returned.

::: tip NOTE

Instead of returning a list, the result data will be a single object representing the first item.

:::

## Examples

```
# Returns the first item of the result set
?single=1

?filter[author][first_name]=Rijk
&single
```
