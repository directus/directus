<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useDebounceFn } from '@vueuse/core';
import { Search } from 'lucide-vue-next';

type SearchResult = {
	id: string;
	title: string;
	description: string;
	type: string;
	link: string;
	content: string;
};

const open = ref(false);
const results = ref<SearchResult[]>([]);
const loading = ref(false);
const searched = ref(false);
const router = useRouter();

const fetchResults = async (search: string) => {
	if (search.length < 3) {
		results.value = [];
		searched.value = false;
		return;
	}

	loading.value = true;
	searched.value = true;

	try {
		const data = await $fetch<SearchResult[]>('/api/search', {
			params: { search },
		});

		results.value = [...data];
		await nextTick();
	} catch {
		results.value = [];
	} finally {
		loading.value = false;
	}
};

const debouncedFetchResults = useDebounceFn(fetchResults, 300);

onMounted(() => {
	const onKeyDown = (e: KeyboardEvent) => {
		if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
			e.preventDefault();
			open.value = !open.value;
		}
	};

	window.addEventListener('keydown', onKeyDown);
	return () => window.removeEventListener('keydown', onKeyDown);
});

watch(open, (isOpen) => {
	if (!isOpen) {
		results.value = [];
		searched.value = false;
		loading.value = false;
	}
});
</script>

<template>
	<div class="sm:max-w-[540px] max-w-full">
		<Button variant="ghost" size="icon" aria-label="Search" @click="open = true">
			<Search class="size-5" />
		</Button>

		<CommandDialog v-model:open="open">
			<Command>
				<DialogTitle class="p-2 sr-only">Search</DialogTitle>
				<DialogDescription class="px-2 sr-only">Search for pages or posts</DialogDescription>

				<CommandInput
					placeholder="Search for pages or posts"
					class="m-2 p-4 focus:outline-none text-base leading-normal"
					@input="(e: Event) => debouncedFetchResults((e.target as HTMLInputElement).value)"
				/>

				<CommandList class="p-2 text-foreground max-h-[500px] overflow-auto">
					<CommandEmpty v-if="!loading && !searched" class="py-2 text-sm text-center">
						Enter a search term above to see results
					</CommandEmpty>
					<CommandEmpty v-if="loading" class="py-2 text-sm text-center">Loading...</CommandEmpty>
					<CommandEmpty v-if="!loading && searched && results.length === 0" class="py-2 text-sm text-center">
						No results found
					</CommandEmpty>
					<CommandGroup v-if="!loading && results.length > 0" heading="Search Results" class="pt-2">
						<CommandItem
							v-for="result in results"
							:key="result.id"
							class="flex items-start gap-4 px-2 py-3"
							:value="`${result.title} ${result.description} ${result.type} ${result.link} ${result.content}`"
							@select="
								router.push(result.link);
								open = false;
							"
						>
							<Badge variant="default">{{ result.type }}</Badge>
							<div class="ml-2 w-full">
								<p class="font-medium text-base">{{ result.title }}</p>
								<p v-if="result.description" class="text-sm mt-1 line-clamp-2">{{ result.description }}</p>
							</div>
						</CommandItem>
					</CommandGroup>
				</CommandList>
			</Command>
		</CommandDialog>
	</div>
</template>
