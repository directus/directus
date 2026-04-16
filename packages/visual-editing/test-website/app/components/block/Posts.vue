<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter, useAsyncData } from 'nuxt/app';
import { readItems } from '@directus/sdk';
import { ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from 'lucide-vue-next';
import { apply, setAttr } from '@directus/visual-editing';

interface Post {
	id: string;
	title: string;
	slug: string;
	description?: string;
	image?: string;
}

interface PostsProps {
	data: {
		tagline?: string;
		headline?: string;
		posts: Post[];
		limit: number;
	};
}

const props = defineProps<PostsProps>();

const route = useRoute();
const router = useRouter();

const perPage = props.data.limit || 6;
const currentPage = ref(Number(route.query.page) || 1);
const version = route.query.version as string | undefined;

const { data: totalPagesData, refresh: totalPagesRefresh } = await useAsyncData('posts-total-pages', async () => {
	const { $directus } = useNuxtApp();
	const result = await $directus.request(
		readItems('posts', {
			aggregate: { count: '*' },
			filter: { status: { _eq: 'published' } },
		}),
	);
	return { total: Number((result as Array<{ count: string }>)[0]?.count) || 0 };
});
const totalPages = computed(() => Math.ceil((totalPagesData.value?.total || 0) / perPage));

const {
	data: paginatedPosts,
	error: fetchError,
	refresh: postsRefresh,
} = await useAsyncData(
	'paginated-posts',
	async () => {
		const { $directus, $readItemWithVersionFallbackToMain } = useNuxtApp();

		const postIds = await $directus.request(
			readItems('posts', {
				limit: perPage,
				page: currentPage.value,
				sort: ['-published_at'],
				fields: ['id'],
				filter: { status: { _eq: 'published' } },
			}),
		);

		const posts = (await Promise.all(
			postIds.map((p) =>
				$readItemWithVersionFallbackToMain(
					'posts',
					p.id,
					{
						fields: ['id', 'title', 'description', 'slug', 'image'],
					},
					version,
				),
			),
		)) as Post[];

		return posts;
	},
	{ watch: [currentPage] },
);

const handlePageChange = (page: number) => {
	if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
		currentPage.value = page;
		router.push({ query: { page } });
	}
};

const visiblePages = 5;
const paginationLinks = computed(() => {
	const pages: (number | string)[] = [];

	if (totalPages.value <= visiblePages) {
		for (let i = 1; i <= totalPages.value; i++) pages.push(i);
	} else {
		const rangeStart = Math.max(1, currentPage.value - 2);
		const rangeEnd = Math.min(totalPages.value, currentPage.value + 2);
		if (rangeStart > 1) pages.push('ellipsis-start');
		for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);
		if (rangeEnd < totalPages.value) pages.push('ellipsis-end');
	}

	return pages;
});

const postsRef = useTemplateRef('posts');

(function useVisualEditingTest() {
	const {
		public: { visualEditingTestEnv, testCase, directusUrl },
	} = useRuntimeConfig();

	if (!visualEditingTestEnv) return;

	if (testCase === 'refresh') {
		onMounted(() => {
			apply({
				directusUrl,
				elements: postsRef.value,
				onSaved: () => {
					totalPagesRefresh();
					postsRefresh();
				},
			});
		});
	}

	if (testCase === 'refresh-customized') {
		onMounted(() => {
			apply({
				directusUrl,
				elements: postsRef.value,
				onSaved: () => {
					totalPagesRefresh();
					postsRefresh();
				},
				customClass: 'my-custom-posts',
			});
		});
	}
})();
</script>

<template>
	<div ref="posts">
		<Tagline v-if="data.tagline" :tagline="data.tagline" />
		<Headline v-if="data.headline" :headline="data.headline" />

		<p v-if="fetchError" class="text-center text-red-500">{{ fetchError }}</p>

		<div class="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
			<template v-if="paginatedPosts">
				<NuxtLink
					v-for="post in paginatedPosts"
					:key="post.id"
					:to="`/blog/${post.slug}`"
					class="group block overflow-hidden rounded-lg p-2"
					:data-directus="
						setAttr({
							collection: 'posts',
							item: post.id,
							fields: ['image', 'title', 'description'],
						})
					"
				>
					<div
						class="relative w-full h-[256px] overflow-hidden rounded-lg"
						:data-directus="
							setAttr({
								collection: 'posts',
								item: post.id,
								fields: 'image',
								mode: 'modal',
							})
						"
					>
						<DirectusImage
							v-if="post.image"
							:uuid="post.image"
							:alt="post.title"
							class="w-full h-full object-cover rounded-lg transition-transform duration-300 group-hover:scale-110"
							sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
						/>
					</div>
					<div class="py-4">
						<h3
							:data-directus="
								setAttr({
									collection: 'posts',
									item: post.id,
									fields: 'title',
									mode: 'popover',
								})
							"
							class="text-xl group-hover:text-accent font-heading transition-colors duration-300"
						>
							{{ post.title }}
						</h3>
						<p v-if="post.description" class="text-sm text-foreground mt-2">
							{{ post.description }}
						</p>
					</div>
				</NuxtLink>
			</template>
			<p v-else class="text-center text-gray-500">No posts available.</p>
		</div>
		<ClientOnly>
			<Pagination v-if="totalPages > 1 && paginatedPosts?.length" class="mt-6">
				<div v-if="totalPages" class="flex items-center justify-center space-x-2">
					<div v-if="totalPages > 5 && currentPage > 1" class="flex items-center">
						<PaginationFirst @click="handlePageChange(1)">
							<ChevronsLeft class="h-4 w-4" />
						</PaginationFirst>
						<PaginationPrev @click="handlePageChange(currentPage - 1)">
							<ChevronLeft class="h-4 w-4" />
						</PaginationPrev>
					</div>
					<template v-for="(page, index) in paginationLinks" :key="index">
						<PaginationListItem v-if="typeof page === 'number'" :value="page" @click="handlePageChange(page)">
							<button
								class="w-10 h-10 flex items-center justify-center rounded-md"
								:class="{ 'bg-accent text-white': currentPage === page, 'bg-background': currentPage !== page }"
							>
								{{ page }}
							</button>
						</PaginationListItem>
						<PaginationEllipsis v-else class="px-2" />
					</template>
					<div v-if="totalPages > 5 && currentPage < totalPages" class="flex items-center">
						<PaginationNext @click="handlePageChange(currentPage + 1)">
							<ChevronRight class="h-4 w-4" />
						</PaginationNext>
						<PaginationLast @click="handlePageChange(totalPages)">
							<ChevronsRight class="h-4 w-4" />
						</PaginationLast>
					</div>
				</div>
			</Pagination>
		</ClientOnly>
	</div>
</template>

<style>
.my-custom-posts {
	--directus-visual-editing--rect--border-color: red;
	--directus-visual-editing--edit-btn--bg-color: red;
	--directus-visual-editing--rect--border-spacing: 4px;
	--directus-visual-editing--rect--border-width: 1px;
	--directus-visual-editing--rect--border-radius: 0;
	--directus-visual-editing--edit-btn--radius: 2px;
}
</style>
