<script setup lang="ts">
import { clone } from 'lodash';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import ExtensionOptions from '../shared/extension-options.vue';
import { syncFieldDetailStoreProperty, useFieldDetailStore } from '../store';
import VFancySelect, { FancySelectItem } from '@/components/v-fancy-select.vue';
import VNotice from '@/components/v-notice.vue';
import VSkeletonLoader from '@/components/v-skeleton-loader.vue';
import { useExtension } from '@/composables/use-extension';

const fieldDetailStore = useFieldDetailStore();

const { loading, field, displaysForType } = storeToRefs(fieldDetailStore);

const interfaceId = computed(() => field.value.meta?.interface ?? null);
const display = syncFieldDetailStoreProperty('field.meta.display');

const selectedInterface = useExtension('interface', interfaceId);
const selectedDisplay = useExtension('display', display);

const selectItems = computed(() => {
	let recommended = clone(selectedInterface.value?.recommendedDisplays) || [];

	recommended.push('raw', 'formatted-value');
	recommended = [...new Set(recommended)];

	const displayItems: FancySelectItem[] = displaysForType.value.map((display) => {
		const item: FancySelectItem = {
			text: display.name,
			description: display.description,
			value: display.id,
			icon: display.icon,
		};

		if (recommended.includes(item.value as string)) {
			item.iconRight = 'star';
		}

		return item;
	});

	const recommendedItems: FancySelectItem[] = [];

	const recommendedList = recommended.map((key: any) => displayItems.find((item) => item.value === key));

	if (recommendedList !== undefined) {
		recommendedItems.push(...recommendedList.filter((item): item is FancySelectItem => !!item));
	}

	if (displayItems.length >= 5 && recommended.length > 0) {
		recommendedItems.push({ divider: true });
	}

	const displayList = displayItems.filter((item) => recommended.includes(item.value as string) === false);

	if (displayList !== undefined) {
		recommendedItems.push(...displayList.filter((i) => i));
	}

	return recommendedItems;
});

const customOptionsFields = computed(() => {
	if (typeof selectedDisplay.value?.options === 'function') {
		return selectedDisplay.value?.options(fieldDetailStore);
	}

	return undefined;
});

const options = computed({
	get() {
		return fieldDetailStore.field.meta?.display_options ?? {};
	},
	set(newOptions: Record<string, any>) {
		fieldDetailStore.update({
			field: {
				meta: {
					display_options: newOptions,
				},
			},
		});
	},
});
</script>

<template>
	<div>
		<VSkeletonLoader v-if="loading" />
		<VFancySelect v-else v-model="display" class="select" :items="selectItems" />

		<VSkeletonLoader v-if="loading" />
		<template v-else>
			<VNotice v-if="display && !selectedDisplay" class="not-found" type="danger">
				{{ $t('display_not_found', { display: display }) }}
				<div class="spacer" />
				<button @click="display = null">{{ $t('reset_display') }}</button>
			</VNotice>

			<ExtensionOptions
				v-if="display && selectedDisplay"
				v-model="options"
				type="display"
				:options="customOptionsFields"
				:extension="display"
			/>
		</template>
	</div>
</template>

<style lang="scss" scoped>
.type-title,
.select {
	margin-block-end: 32px;
}

.not-found {
	.spacer {
		flex-grow: 1;
	}

	button {
		text-decoration: underline;
	}
}

.v-notice,
.v-skeleton-loader {
	margin-block-end: 36px;
}
</style>
