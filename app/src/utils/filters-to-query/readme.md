# Filters to Query

Converts an array of filter objects to an object of query params.

## Usage

```ts
const multipleFilters: Filter[] = [
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

filtersToQuery(multipleFilters);

// {
//   _and: [
//     {
//       title: {
//         _contains: 'directus'
//       }
//     },
//     {
//       author: {
//         _eq: 1
//       }
//     }
//   ]
// }


const singleFilter: Filter[] = [
	{
		field: 'title',
		operator: 'contains',
		value: 'directus',
	}
];

filtersToQuery(singleFilter);

// {
//   title: {
//     _contains: 'directus'
//   }
// }
```
