<script setup lang="ts">
import { getFriendlyDate } from '../../lib/date.js';
import Avatar from '../Avatar.vue';
import Meta from '../Meta.vue';
import Tag from './Tag.vue';

interface PostMetaProps {
	params: {
		title: string;
		slug: string;
		date_published: string;
		author: {
			first_name?: string;
			last_name?: string;
			avatar?: string;
			title?: string;
		};
		tags: {
			title: string;
			slug: string;
		}[];
		contributors?: Contributor[];
	};
}

interface Contributor {
	name: string;
	url?: string;
}

defineProps<PostMetaProps>();

function getTag(person: Contributor) {
	if (person.url) {
		return {
			tag: 'a',
			props: {
				href: person.url,
				target: '_blank',
				rel: 'noopener noreferrer',
				style: { display: 'block' },
			},
		};
	}

	return {
		tag: 'div',
		props: {},
	};
}
</script>

<template>
	<p class="date">Published {{ getFriendlyDate(params.date_published) }}</p>
	<Meta title-left="Written By" title-right="With Thanks To" title-bottom="Tags">
		<template #left>
			<Avatar
				:image="`https://marketing.directus.app/assets/${params.author.avatar}?key=circle`"
				:name="params.author.first_name + ' ' + params.author.last_name"
				:title="params.author.title ?? 'Contributor'"
			/>
		</template>

		<template v-if="params.contributors" #right>
			<template v-for="(person, _personIdx) in params.contributors" :key="_personIdx">
				<component :is="getTag(person).tag" v-bind="getTag(person).props">
					{{ person.name }}
				</component>
			</template>
		</template>

		<template v-if="params.tags.length > 0" #bottom>
			<Tag v-for="tag in params.tags" :key="tag.slug" class="tag" :href="`/blog/tags/${tag.slug}`" as="a">
				{{ tag.title }}
			</Tag>
		</template>
	</Meta>
</template>

<style scoped>
.date {
	text-transform: capitalize;
	color: var(--vp-c-gray);
}
.dark .date {
	color: var(--vp-c-gray-light-1);
}
</style>
