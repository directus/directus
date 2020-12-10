# Sorting

`sort` is a CSV of fields used to sort the fetched items. Sorting defaults to ascending (ASC) order but a minus sign
(`-`) can be used to reverse this to descending (DESC) order. Fields are prioritized by their order in the CSV.

## Examples

```
# Sorts by name ASC
?sort=name

# Sorts by name ASC, followed by age DESC
?&sort=name,-age

# Sorts by name ASC, followed by age DESC
?sort=name,-age
```
