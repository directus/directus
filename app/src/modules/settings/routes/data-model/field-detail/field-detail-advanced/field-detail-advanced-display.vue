<template>
	<div>
		<v-fancy-select v-model="display" class="select" :items="selectItems" />

		<v-notice v-if="display && !selectedDisplay" class="not-found" type="danger">
			{{ t('display_not_found', { display: display }) }}
			<div class="spacer" />
			<button @click="display = null">{{ t('reset_display') }}</button>
		</v-notice>

		<extension-options
			v-if="display && selectedDisplay"
			v-model="options"
			type="display"
			:options="customOptionsFields"
			:extension="display"
		/>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, computed } from 'vue';
import { getDisplay } from '@/displays';
import { getInterface } from '@/interfaces';
import { FancySelectItem } from '@/components/v-fancy-select/types';
import { clone } from 'lodash';
import { useFieldDetailStore, syncFieldDetailStoreProperty } from '../store';
import { storeToRefs } from 'pinia';
import ExtensionOptions from '../shared/extension-options.vue';

export default defineComponent({
	components: { ExtensionOptions },
	setup() {
		const { t } = useI18n();

		const fieldDetailStore = useFieldDetailStore();

		const { field, displaysForType } = storeToRefs(fieldDetailStore);

		const interfaceID = computed(() => field.value.meta?.interface);
		const display = syncFieldDetailStoreProperty('field.meta.display');

		const selectedInterface = computed(() => getInterface(interfaceID.value));
		const selectedDisplay = computed(() => getDisplay(display.value));

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

			const recommendedItems: (FancySelectItem | { divider: boolean } | undefined)[] = [];

			const recommendedList = recommended.map((key: any) => displayItems.find((item) => item.value === key));
			if (recommendedList !== undefined) {
				recommendedItems.push(...recommendedList.filter((i: any) => i));
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

			return null;
		});

		const options = computed({
			get() {
				return fieldDetailStore.field.meta?.display_options ?? {};
			},
			set(newOptions: Record<string, any>) {
				fieldDetailStore.$patch((state) => {
					state.field.meta = {
						...(state.field.meta ?? {}),
						display_options: newOptions,
					};
				});
			},
		});

		return { t, selectItems, selectedDisplay, display, options, customOptionsFields };
	},
});
</script>

<style lang="scss" scoped>
.type-title,
.select {
	margin-bottom: 32px;
}

.not-found {
	.spacer {
		flex-grow: 1;
	}

	button {
		text-decoration: underline;
	}
}

.v-notice {
	margin-bottom: 36px;
}
</style>
