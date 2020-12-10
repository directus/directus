# Fields

`fields` is a CSV of columns to include in the result. This parameter supports dot notation to request nested relational
fields. You can also use a wildcard (\*) to include all fields at a specific depth.

## Examples

```
# Get all top-level fields
?fields=*

# Get all top-level fields and all second-level relational fields
?fields=*.*

# Get all top-level fields and second-level relational fields within images
?fields=*,images.*

# Get only the first_name and last_name fields
?fields=first_name,last_name

# Get all top-level and second-level relational fields, and third-level fields within images.thumbnails
?fields=*.*,images.thumbnails.*
```

Alternatively, you can use the array syntax to specify multiple fields:

```
?fields[]=*
&fields[]=images.*


?fields[]=first_name
&fields[]=last_name


?fields[]=title
&fields[]=images
&fields[]=thumbnails.*
```
