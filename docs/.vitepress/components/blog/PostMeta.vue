<template>
	<p class="date">
		Published {{ getFriendlyDate(params.date_published) }}
	</p>
	<div class="wrapper">
		<div class="author">
			<div>
				<span class="sm-gray-text">Written By</span>
				<Avatar
					class="mt-1"
					:image="`https://marketing.directus.app/assets/${params.author.avatar}?key=circle`"
					:name="params.author.first_name + ' ' + params.author.last_name"
					:title="params.author.title ?? 'Contributor'"
				/>
			</div>
			<div v-if="params.contributors" class="contributors">
				<span class="sm-gray-text">With Thanks To</span>
				<div class="mt-1">
					<template v-for="(person, personIdx) in params.contributors" :key="personIdx">
						<component :is="getTag(person).tag" v-bind="getTag(person).props">
							{{ person.name }}
						</component>
					</template>
				</div>
			</div>
		</div>

		<div v-if="params.tags.length > 0" class="tags">
			<span class="sm-gray-text">Tags</span>
			<Tag class="tag" v-for="tag in params.tags" :key="tag.slug" :href="`/blog/tags/${tag.slug}`">{{ tag.title }}</Tag>
		</div>
	</div>
</template>

<script setup lang="ts">
import { getFriendlyDate } from '../../utils/time.js';
import Tag from './Tag.vue';
import Avatar from '../Avatar.vue';

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
			},
		};
	}

	return {
		tag: 'div',
		props: {},
	};
}
</script>

<style scoped>
.mt-1 {
	margin-top: 4px;
}
.tags {
	display: flex;
	border-top: 1px solid var(--vp-c-divider);
	flex-wrap: wrap;
	margin-top: 0.75em;
	padding-top: 0.5em;
	align-items: baseline;
	gap: 0.75em;
}

.sm-gray-text {
	color: var(--vp-c-gray-light-1);
	font-size: 0.75rem;
	font-weight: 500;
}

.tags span {
	font-weight: 500;
	color: var(--vp-c-gray-light-1);
}

.author {
}

.author > * + * {
	margin-top: 1em;
}

.date {
	text-transform: capitalize;
	color: var(--vp-c-gray);
}
.dark .date {
	color: var(--vp-c-gray-light-1);
}
.wrapper {
	border: 1px solid var(--vp-c-divider);
	border-radius: 8px;
	padding: 11px 16px 9px;
}

@media only screen and (min-width: 768px) {
	.author {
		display: flex;
		justify-content: space-between;
	}
	.author > * + * {
		margin-top: 0;
	}

	.contributors {
		text-align: right;
	}
}
</style>
