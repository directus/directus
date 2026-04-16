<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRuntimeConfig } from '#app';
import DirectusImage from '~/components/shared/DirectusImage.vue';
import Separator from '~/components/ui/separator/Separator.vue';
import { readItems, readUser } from '@directus/sdk';
import { apply, remove, setAttr } from '@directus/visual-editing';

const route = useRoute();
const slug = route.params.slug as string;
const version = route.query.version as string | undefined;

const runtimeConfig = useRuntimeConfig();

const { data: post, refresh: refresh } = await useAsyncData<Post>(`posts-${slug}`, async () => {
	try {
		const { $directus, $readItemWithVersionFallbackToMain } = useNuxtApp();

		const posts = await $directus.request(
			readItems('posts', {
				filter: { slug: { _eq: slug }, status: { _eq: 'published' } },
				limit: 1,
				fields: ['id'],
			}),
		);

		if (!posts.length) {
			throw createError({ statusCode: 404, message: `Post not found: ${slug}` });
		}

		return (await $readItemWithVersionFallbackToMain(
			'posts',
			posts[0]!.id,
			{
				fields: ['id', 'title', 'content', 'status', 'image', 'description', 'author'],
			},
			version,
		)) as Post;
	} catch (err: unknown) {
		if (err && typeof err === 'object' && 'statusCode' in err) throw err;
		throw createError({ statusCode: 500, message: `Failed to fetch post: ${slug}` });
	}
});

const { data: relatedPosts, refresh: relatedPostsRefresh } = await useAsyncData<Post[]>(
	`related-posts-${slug}`,
	async () => {
		const { $directus, $readItemWithVersionFallbackToMain } = useNuxtApp();

		try {
			const ids = await $directus.request(
				readItems('posts', {
					filter: { status: { _eq: 'published' }, slug: { _neq: slug } },
					fields: ['id'],
					limit: 2,
				}),
			);
			return (await Promise.all(
				ids.map((p) =>
					$readItemWithVersionFallbackToMain('posts', p.id, { fields: ['id', 'title', 'image', 'slug'] }, version),
				),
			)) as unknown as Post[];
		} catch (err: unknown) {
			if (err && typeof err === 'object' && 'statusCode' in err) throw err;
			throw createError({ statusCode: 500, message: 'Failed to fetch related posts' });
		}
	},
);

const authorId = computed(() => post.value?.author || null);
const { data: author } = await useAsyncData<DirectusUser | null>(
	`posts-author-${authorId.value}`,
	async () => {
		const { $directus } = useNuxtApp();

		if (!authorId.value) {
			throw createError({ statusCode: 400, message: 'Missing author ID' });
		}

		try {
			const author = await $directus.request<DirectusUser | null>(
				readUser(String(authorId.value), {
					fields: ['first_name', 'last_name', 'avatar'],
				}),
			);

			if (!author) {
				throw createError({ statusCode: 404, message: `Author not found: ${authorId.value}` });
			}

			return author;
		} catch (err: unknown) {
			if (err && typeof err === 'object' && 'statusCode' in err) throw err;
			throw createError({ statusCode: 500, message: `Failed to fetch author: ${authorId.value}` });
		}
	},
	{ watch: [post], server: false, transform: (data) => (authorId.value ? data : null) },
);

const postUrl = computed(() => `${runtimeConfig.public.siteUrl}/blog/${slug}`);
const authorName = computed(() => {
	if (!author.value) return '';
	return [author.value.first_name, author.value.last_name].filter(Boolean).join(' ');
});

const authorAvatar = computed(() => {
	if (!author.value?.avatar) return null;
	return typeof author.value.avatar === 'string' ? author.value.avatar : author.value.avatar.id;
});

useHead({
	title: post.value?.title,
	meta: [
		{ name: 'description', content: post.value?.description },
		{ property: 'og:title', content: post.value?.title },
		{ property: 'og:description', content: post.value?.description },
		{ property: 'og:url', content: postUrl.value },
	],
});

(function useVisualEditingTest() {
	if (!import.meta.client) return;

	const {
		public: { visualEditingTestEnv, testCase, directusUrl },
	} = useRuntimeConfig();

	if (!visualEditingTestEnv) return;

	const { enabled } = usePreviewMode({
		shouldEnable: () => visualEditingTestEnv === 'ssg' && testCase === 'refresh-ssg',
		onEnable: () => refreshData(),
	});

	if (testCase === 'refresh-ssg') {
		onMounted(() => {
			if (enabled) refreshData();
			apply({ directusUrl, onSaved: () => refreshData() });
		});
		onUnmounted(() => remove());
	}

	if (testCase === 'refresh' || testCase === 'refresh-customized') {
		onMounted(() => {
			apply({ directusUrl, onSaved: () => refreshData() });
		});
	}

	function refreshData() {
		refresh();
		relatedPostsRefresh();
	}
})();
</script>

<template>
	<div v-if="post">
		<Container class="py-12">
			<div v-if="post.image" class="mb-8 w-full">
				<div
					class="relative w-full h-[400px] md:h-[500px] overflow-hidden"
					:data-directus="
						setAttr({ collection: 'posts', item: post.id, fields: ['image', 'header-gebh3-'], mode: 'modal' })
					"
				>
					<DirectusImage
						:uuid="post.image as string"
						:alt="post.title || 'post header image'"
						class="object-cover w-full h-full"
						sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
						fill
					/>
				</div>
			</div>

			<Headline
				:headline="post.title"
				as="h2"
				class="!text-accent mb-4"
				:data-directus="setAttr({ collection: 'posts', item: post.id, fields: 'title', mode: 'popover' })"
			/>
			<div class="w-full">
				<Separator class="h-[1px] bg-gray-300 my-8" />
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-[minmax(0,_2fr)_400px] gap-12">
				<main class="text-left">
					<Text
						:content="post.content || ''"
						:data-directus="setAttr({ collection: 'posts', item: post.id, fields: 'content' })"
					/>
				</main>

				<aside class="space-y-6 p-6 rounded-lg max-w-[496px] h-fit bg-background-muted">
					<div
						v-if="author"
						class="flex items-center space-x-4"
						:data-directus="
							setAttr({
								collection: 'directus_users',
								item: String(post.author),
								fields: ['first_name', 'last_name'],
								mode: 'popover',
							})
						"
					>
						<DirectusImage
							v-if="authorAvatar"
							:uuid="authorAvatar"
							:alt="authorName || 'author avatar'"
							class="rounded-full object-cover size-[48px]"
							:width="48"
							:height="48"
						/>
						<div>
							<p v-if="authorName" class="font-bold">{{ authorName }}</p>
						</div>
					</div>

					<p
						v-if="post.description"
						:data-directus="
							setAttr({
								collection: 'posts',
								item: post.id,
								fields: 'description',
								mode: 'popover',
							})
						"
					>
						{{ post.description }}
					</p>

					<div
						class="flex justify-start"
						:data-directus="
							setAttr({
								collection: 'posts',
								item: post.id,
								fields: 'slug',
								mode: 'popover',
							})
						"
					>
						<ShareDialog :post-url="postUrl" :post-title="post.title" />
					</div>
					<div>
						<Separator class="h-[1px] bg-gray-300 my-4" />
						<h3 class="font-bold mb-4">Related Posts</h3>
						<div class="space-y-4">
							<NuxtLink
								v-for="relatedPost in relatedPosts"
								:key="relatedPost.id"
								:to="`/blog/${relatedPost.slug}`"
								class="flex items-center space-x-4 hover:text-accent group"
							>
								<div v-if="relatedPost.image" class="relative shrink-0 w-[150px] h-[100px] overflow-hidden rounded-lg">
									<DirectusImage
										:uuid="relatedPost.image as string"
										:alt="relatedPost.title || 'related posts'"
										class="object-cover transition-transform duration-300 group-hover:scale-110"
										fill
										sizes="(max-width: 768px) 100px, (max-width: 1024px) 150px, 150px"
									/>
								</div>
								<span class="font-heading">{{ relatedPost.title }}</span>
							</NuxtLink>
						</div>
					</div>
				</aside>
			</div>
		</Container>
	</div>
	<div v-else class="text-center text-xl mt-[20%]">404 - Post Not Found</div>
</template>
