<template>
	<template v-for="({ highlighted, text: textContent }, index) in parts">
		<mark v-if="highlighted" :key="index" class="highlight">{{ textContent }}</mark>
		<template v-else>{{ textContent }}</template>
	</template>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';
import { flatten } from 'lodash';
import { remove as removeDiacritics } from 'diacritics';
import { toArray } from '@directus/shared/utils';

type HighlightPart = {
	text: string;
	highlighted: boolean;
};

export default defineComponent({
	name: 'VHighlight',
	props: {
		query: {
			type: [String, Array] as PropType<string | string[]>,
			default: null,
		},
		text: {
			type: String,
			default: '',
		},
	},
	setup(props) {
		const parts = computed<HighlightPart[]>(() => {
			let searchText = removeDiacritics(props.text.toLowerCase());

			const queries = toArray(props.query);

			if (queries.length === 0) {
				return [
					{
						highlighted: false,
						text: props.text,
					},
				];
			}

			const matches = flatten(
				queries
					.filter((query) => query)
					.map((query) => {
						query = removeDiacritics(query.toLowerCase());

						const indices = [];

						let startIndex = 0;
						let index = searchText.indexOf(query, startIndex);

						while (index > -1) {
							startIndex = index + query.length;
							indices.push([index, startIndex]);
							index = searchText.indexOf(query, index + 1);
						}

						return indices;
					})
			);

			matches.sort((a, b) => {
				if (a[0] !== b[0]) return a[0] - b[0];
				return a[1] - b[1];
			});

			if (matches.length === 0) {
				return [
					{
						highlighted: false,
						text: props.text,
					},
				];
			}

			const mergedMatches = [];

			let curStart = matches[0][0];
			let curEnd = matches[0][1];

			matches.shift();

			for (const [start, end] of matches) {
				if (start >= curEnd) {
					mergedMatches.push([curStart, curEnd]);
					curStart = start;
					curEnd = end;
				} else if (end > curEnd) {
					curEnd = end;
				}
			}

			mergedMatches.push([curStart, curEnd]);

			let lastEnd = 0;

			const parts: HighlightPart[] = [];

			for (const [start, end] of mergedMatches) {
				if (lastEnd !== start) {
					parts.push({
						highlighted: false,
						text: props.text.slice(lastEnd, start),
					});
				}

				parts.push({
					highlighted: true,
					text: props.text.slice(start, end),
				});

				lastEnd = end;
			}

			if (lastEnd !== searchText.length) {
				parts.push({
					highlighted: false,
					text: props.text.slice(lastEnd),
				});
			}

			return parts;
		});

		return { parts };
	},
});
</script>

<style scoped>
mark {
	margin: -1px -2px;
	padding: 1px 2px;
	background-color: var(--primary-25);
	border-radius: var(--border-radius);
}
</style>
