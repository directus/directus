# Filters to Query

Converts an array of filter objects to an Axios compatible object of query params.

## Usage

```ts
const filters: Filter[] = [
	{
		field: 'title',
		operator: 'contains',
		value: 'directus',
	},
	{
		field: 'author',
		operator: 'eq',
		value: 1,
	},
];

filtersToQuery(filters);

// {
//   'filter[title][contains]': 'directus',
//   'filter[author][eq]: 1
// }
```
