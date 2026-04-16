<script setup lang="ts">
import Text from '~/components/base/Text.vue';
import DirectusImage from '~/components/shared/DirectusImage.vue';
import { setAttr, apply, remove, disable } from '@directus/visual-editing';

interface HeroProps {
	data: {
		id: 'string';
		tagline: string;
		headline: string;
		description: string;
		layout: 'image_image_left' | 'image_center' | 'image_left';
		image: string;
		button_group?: {
			buttons: Array<{
				id: string;
				label: string | null;
				variant: string | null;
				url: string | null;
				type: 'url' | 'page' | 'post';
				pagePermalink?: string | null;
				postSlug?: string | null;
			}>;
		};
	};
}

defineProps<HeroProps>();

const heroRef = useTemplateRef('hero');
const { showMethods, editables, disableAll, enableDisabled } = useVisualEditingTest();

function useVisualEditingTest() {
	const {
		public: { visualEditingTestEnv, testCase, directusUrl },
	} = useRuntimeConfig();

	const editables = ref<any>();
	const disabledEditables = ref<any>();
	const showMethods = visualEditingTestEnv && testCase === 'methods';

	if (visualEditingTestEnv && testCase === 'methods') {
		useRuntimeHook('page:finish', async () => {
			if (!import.meta.client) return;

			editables.value = await apply({
				directusUrl,
				elements: heroRef.value,
				customClass: 'method-scope',
				onSaved: () => refreshNuxtData(),
			});
		});
	}

	return {
		showMethods,
		editables,
		disableAll,
		enableDisabled,
	};

	function disableAll() {
		disabledEditables.value = disable();
	}

	function enableDisabled() {
		disabledEditables.value?.enable();
	}
}
</script>

<template>
	<div ref="hero" class="relative">
		<div
			v-if="showMethods"
			class="absolute top-0 left-0 -translate-y-14 flex gap-2 [&_button]:bg-gray-500 [&_button:hover]:bg-[fuchsia] [&_button]:text-gray-100 [&_button]:px-2 [&_button]:pt-1 [&_button]:rounded-sm"
		>
			<button @click="editables?.disable()">Disable</button>
			<button @click="editables?.enable()">Enable</button>
			<button @click="editables?.remove()">Remove</button>
			<button @click="disableAll()">Disable All</button>
			<button @click="enableDisabled()">Enable All Disabled</button>
			<button @click="remove()">Remove All</button>
		</div>

		<section
			class="relative w-full mx-auto flex flex-col gap-6 md:gap-12"
			:class="{
				'items-center text-center': data.layout === 'image_center',
				'md:flex-row-reverse items-center': data.layout === 'image_left',
				'md:flex-row items-center': data.layout !== 'image_center' && data.layout !== 'image_left',
			}"
			:data-directus="setAttr({ collection: 'block_hero', item: data.id, fields: ['image', 'layout'] })"
		>
			<div
				class="flex flex-col gap-4 w-full"
				:class="{
					'md:w-3/4 xl:w-2/3 items-center': data.layout === 'image_center',
					'md:w-1/2 items-start': data.layout !== 'image_center',
				}"
			>
				<Tagline
					:tagline="data.tagline"
					:data-directus="setAttr({ collection: 'block_hero', item: data.id, fields: 'tagline', mode: 'popover' })"
				/>
				<Headline
					:headline="data.headline"
					:data-directus="setAttr({ collection: 'block_hero', item: data.id, fields: 'headline', mode: 'popover' })"
				/>
				<Text
					v-if="data.description"
					:content="data.description"
					:data-directus="setAttr({ collection: 'block_hero', item: data.id, fields: 'description', mode: 'popover' })"
				/>

				<div
					v-if="data.button_group?.buttons?.length"
					class="mt-6"
					:class="{ 'flex justify-center': data.layout === 'image_center' }"
					:data-directus="setAttr({ collection: 'block_hero', item: data.id, fields: 'button_group', mode: 'popover' })"
				>
					<ButtonGroup :buttons="data.button_group.buttons" />
				</div>
			</div>

			<div
				v-if="data.image"
				class="relative w-full"
				:class="{
					'md:w-3/4 xl:w-2/3 h-[400px]': data.layout === 'image_center',
					'md:w-1/2 h-[562px]': data.layout !== 'image_center',
				}"
			>
				<DirectusImage
					:uuid="data.image"
					:alt="data.tagline || data.headline || 'Hero Image'"
					:fill="true"
					:sizes="data.layout === 'image_center' ? '100vw' : '(max-width: 768px) 100vw, 50vw'"
					class="object-contain"
				/>
			</div>
		</section>
	</div>
</template>

<style>
.method-scope {
	--directus-visual-editing--rect--border-color: fuchsia;
	--directus-visual-editing--edit-btn--bg-color: fuchsia;
}
</style>
