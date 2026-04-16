<script setup lang="ts">
import { useAsyncData, useRoute } from '#app';
import { readItems } from '@directus/sdk';
import PageBuilder from '~/components/PageBuilder.vue';
import { apply } from '@directus/visual-editing';

const route = useRoute();
const permalink = `/${((route.params.permalink as string[]) || []).join('/')}`;
const version = route.query.version as string | undefined;

const { $directus, $readItemWithVersionFallbackToMain } = useNuxtApp();

const {
	data: pageData,
	error: pageError,
	refresh,
} = await useAsyncData(`page-data-${permalink}`, async () => {
	try {
		const pages = await $directus.request(
			readItems('pages', {
				filter: { permalink: { _eq: permalink } },
				limit: 1,
				fields: ['id'],
			}),
		);

		if (!pages.length) {
			throw createError({ statusCode: 404, statusMessage: 'Page not found' });
		}

		const fields = [
			'title',
			'id',
			{
				seo: ['title', 'meta_description', 'og_image'],
				blocks: [
					'id',
					'background',
					'collection',
					'item',
					'sort',
					'hide_block',
					{
						item: {
							block_richtext: ['id', 'tagline', 'headline', 'content', 'alignment'],
							block_gallery: ['id', 'tagline', 'headline', { items: ['id', 'directus_file', 'sort'] }],
							block_pricing: [
								'id',
								'tagline',
								'headline',
								{
									pricing_cards: [
										'id',
										'title',
										'description',
										'price',
										'badge',
										'features',
										'is_highlighted',
										{
											button: ['id', 'label', 'variant', 'url', 'type', { page: ['permalink'] }, { post: ['slug'] }],
										},
									],
								},
							],
							block_hero: [
								'id',
								'tagline',
								'headline',
								'description',
								'layout',
								'image',
								{
									button_group: [
										'id',
										{
											buttons: ['id', 'label', 'variant', 'url', 'type', { page: ['permalink'] }, { post: ['slug'] }],
										},
									],
								},
							],
							block_posts: ['tagline', 'headline', 'collection', 'limit'],
							block_form: [
								'id',
								'tagline',
								'headline',
								{
									form: [
										'id',
										'title',
										'submit_label',
										'success_message',
										'on_success',
										'success_redirect_url',
										'is_active',
										{
											fields: [
												'id',
												'name',
												'type',
												'label',
												'placeholder',
												'help',
												'validation',
												'width',
												'choices',
												'required',
												'sort',
											],
										},
									],
								},
							],
						},
					},
				],
			},
		];

		const query = {
			fields: fields,
			deep: {
				blocks: { _sort: ['sort'], _filter: { hide_block: { _neq: true } } },
			},
		};

		const page = await $readItemWithVersionFallbackToMain('pages', pages[0]!.id, query, version);

		if (Array.isArray(page?.blocks)) {
			for (const block of page.blocks as PageBlock[]) {
				if (
					block.collection === 'block_posts' &&
					block.item &&
					typeof block.item !== 'string' &&
					'collection' in block.item &&
					block.item.collection === 'posts'
				) {
					const blockPost = block.item as BlockPost;
					const limit = blockPost.limit ?? 6;

					const postIds = await $directus.request(
						readItems('posts', {
							fields: ['id'],
							filter: { status: { _eq: 'published' } },
							sort: ['-published_at'],
							limit,
						}),
					);
					const posts = (await Promise.all(
						postIds.map((p) =>
							$readItemWithVersionFallbackToMain(
								'posts',
								p.id,
								{
									fields: ['id', 'title', 'description', 'slug', 'image', 'published_at'],
								},
								version,
							),
						),
					)) as Post[];

					(block.item as BlockPost & { posts: Post[] }).posts = posts;
				}
			}
		}

		return page;
	} catch (err: unknown) {
		if (err && typeof err === 'object' && 'statusCode' in err) throw err;
		throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' });
	}
});

if (!pageData.value && !pageError) {
	throw createError({ statusCode: 404, statusMessage: 'Page not found' });
}

const sections = computed(() => pageData.value?.blocks);

useHead(() => ({
	title: pageData.value?.title ?? '',
	meta: [
		{ property: 'og:title', content: pageData.value?.title || '' },
		{ property: 'og:url', content: `${import.meta.env.VITE_SITE_URL}${permalink}` },
	],
}));

(function useVisualEditingTest() {
	if (!import.meta.client) return;

	const {
		public: { visualEditingTestEnv, testCase, directusUrl },
	} = useRuntimeConfig();

	if (!visualEditingTestEnv) return;

	if (testCase === 'refresh' || testCase === 'refresh-customized') {
		onMounted(() => {
			apply({ directusUrl, onSaved: () => refresh() });
		});
	}
})();
</script>

<template>
	<div>
		<div v-if="pageError">404 - Page Not Found</div>
		<div v-else>
			<PageBuilder :sections />
		</div>
	</div>
</template>
