---
'@directus/api': patch
---

Prevent thumbnail duplication

Because the `resolvePreset` utility accidentally mutated its input it kept adding new "toFormat" transformations to the input resulting in a new hash every run.
This fix makes a shallow copy of the input to prevent mutating the variable in the parent context.
