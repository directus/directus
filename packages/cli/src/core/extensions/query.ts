import { Toolbox } from '../../toolbox';
import JSON5 from 'json5';

export default (toolbox: Toolbox): void => {
	toolbox.query = {
		one: {},
		many: {},
	};

	toolbox.options.register((builder, command) => {
		if (!command.settings?.features?.query || !command.settings?.features?.sdk) {
			return builder;
		}

		builder = builder
			.option('deep', {
				type: 'string',
				description: `
					Allows you to set any of the other query parameters on a nested relational dataset.

					# Examples

					## Limit the nested related articles to 3

					\`\`\`
					$ command \\
					    --deep "{related_articles:{_limit:3}}"
					\`\`\`

					## Only get 3 related articles, with only the top rated comment nested

					\`\`\`
					$ command \\
						--deep "{related_articles:{_limit:3,comments:{_sort:\\"rating\\",_limit:1}}}"
					\`\`\`

				`,
			})
			.option('fields', {
				type: 'array',
				description: `
					Choose the fields that are returned in the current dataset.
					This parameter supports dot notation to request nested relational
					fields. You can also use a wildcard (*) to include all fields at
					a specific depth.

					# Performance & Size

					> While the fields wildcard is very useful for debugging purposes,
					> we recommend only requesting specific fields for production use.
					> By only requesting the fields you really need, you can speed up
					> the request, and reduce the overall output size.

					# Examples

					## Get all top-level fields

					\`\`\`
					$ command \\
					    --filters *
					\`\`\`

					## Get all top-level fields and all second-level relational fields

					\`\`\`
					$ command \\
					    --filters *.*
					\`\`\`

					## Get all top-level fields and second-level relational fields within images

					\`\`\`
					$ command \\
					    --filters *.*,images.*
					\`\`\`

					## Get only the \`first_name\` and \`last_name\` fields

					\`\`\`
					$ command \\
					    --filters first_name,last_name
					\`\`\`

					## Get all top-level and second-level relational fields, and third-level fields within \`images.thumbnails\`

					\`\`\`
					$ command \\
					    --filters *.*,images.thumbnails.*
					\`\`\`
				`,
			})
			.option('filter', {
				type: 'string',
				description: `
					Used to search items in a collection that matches the filter's
					conditions. The filter param follows the Filter Rules spec, which
					includes additional information on logical operators (AND/OR),
					nested relational filtering, and dynamic variables.

					# Examples

					## Retrieve all items where \`first_name\` equals \`"Rijk"\`

					\`\`\`
					$ command \\
					    --filter="{first_name:\\"Rijk\\"}"
					\`\`\`

					## Retrieve all items where \`first_name\` not equals \`"Joao"\`

					\`\`\`
					$ command \\
					    --filter="{first_name:{_neq:\\"Joao\\"}}"
					\`\`\`
				`,
			})
			.option('search', {
				type: 'string',
				description: `
					The search parameter allows you to perform a search on all string
					and text type fields within a collection. It's an easy way to
					search for an item without creating complex field filters – though
					it is far less optimized. It only searches the root item's fields,
					related item fields are not included.

					# Examples

					## Find all items that mention \`Directus\`

					\`\`\`
					$ command \\
					    --search Directus
					\`\`\`
				`,
			});
		/*
			.option('export', {
				type: 'string',
				choices: ['csv', 'json'],
				description: 'Allows you to set any of the other query parameters on a nested relational dataset.',
			})
		*/

		if (command.settings?.features?.query === 'many') {
			builder = builder
				.option('limit', {
					type: 'number',
					default: 100,
					description: `
						Set the maximum number of items that will be returned.
						The default limit is set to 100.

						# Examples

						## Get the first 200 items

						\`\`\`
						$ command \\
							--limit 200
						\`\`\`

						## Get all items

						\`\`\`
						$ command \\
							--limit -1
						\`\`\`
					`,
				})
				.option('page', {
					type: 'number',
					description: `
						An alternative to offset. Page is a way to set offset
						under the hood by calculating \`limit * page\`.
						Page is 1-indexed (starts at 1).

						# Examples

						## Get page 1 (items 1-100)

						\`\`\`
						$ command --limit 100 --page 1
						\`\`\`

						## Get page 2 (items 101-200)

						\`\`\`
						$ command --limit 100 --page 2
						\`\`\`
					`,
				})
				.option('offset', {
					type: 'number',
					description: `
						Skip the first \`n\` items in the response.
						Can be used for pagination.

						# Examples

						## Get items 101—200

						\`\`\`
						$ command --limit 100 --offset 100
						\`\`\`
					`,
				})
				.option('sort', {
					type: 'array',
					description: `
						What field(s) to sort by. Sorting defaults to ascending,
						but :desc suffix can be used to reverse this to descending
						order. Fields are prioritized by the order in the parameter.

						Multiple values are accepted through commas or multiple
						--sort entries. Order is important in this case.

						# Examples

						## Sort by publish date descending

						\`\`\`
						$ command --sort publish_date:desc
						\`\`\`

						## Sort by creation date ascending

						\`\`\`
						$ command --sort created_date:asc
						$ command --sort created_date
						\`\`\`
					`,
				})
				.option('meta', {
					type: 'array',
					choices: ['*', 'total_count', 'filter_count'],
					description: `
						Metadata allows you to retrieve some additional information
						about the items in the collection you're fetching.

						**total_count**

						Returns the total item count of the collection you're querying.

						**filter_count**

						Returns the item count of the collection you're querying, taking the current filter/search parameters into account.

						# Examples

						\`\`\`
						$ command --meta *
						$ command --meta total_count
						$ command --meta filter_count
						\`\`\`
					`,
				});
		}

		return builder;
	});

	toolbox.events.on('command.execute.before', async (command, options) => {
		if (!command.settings?.features?.query || !command.settings?.features?.sdk) {
			return;
		}

		const normalize = (value: any) => {
			if (typeof value === 'undefined') {
				return undefined;
			}
			return JSON5.parse(value);
		};

		const one = {
			deep: normalize(options.deep),
			fields: options.fields,
			filter: normalize(options.filter),
			search: options.search,
			export: options.export,
		};

		if (one.fields) {
			one.fields = Array.from(
				new Set(
					one.fields.flatMap((field: string) => {
						return field.split(',').map((name: string) => name.trim());
					})
				)
			);
		}

		const many = {
			...one,
			limit: options.limit,
			meta: options.meta,
			offset: options.offset,
			page: options.page,
			sort: options.sort,
		};

		if (many.sort) {
			many.sort = many.sort.flatMap((field: string) => {
				return field.split(',').map((name: string) => {
					name = name.trim();
					if (name.endsWith(':asc')) {
						name = name.replace(/:asc$/, '');
						return name.replace(/^-/, '');
					} else if (name.endsWith(':desc')) {
						name = name.replace(/:desc$/, '');
						return `-${name.replace(/^-/, '')}`;
					}
					return name;
				});
			});
		}

		toolbox.query = {
			one,
			many,
		};
	});
};
