<template>
	<div>
		<v-fancy-select class="select" :items="selectItems" v-model="fieldData.meta.display" />

		<v-notice class="not-found" type="danger" v-if="fieldData.meta.display && !selectedDisplay">
			{{ $t('display_not_found', { display: fieldData.meta.display }) }}
			<div class="spacer" />
			<button @click="fieldData.meta.display = null">{{ $t('reset_display') }}</button>
		</v-notice>

		<template v-if="fieldData.meta.display && selectedDisplay">
			<v-notice v-if="!selectedDisplay.options || selectedDisplay.options.length === 0">
				{{ $t('no_options_available') }}
			</v-notice>

			<v-form
				v-else-if="Array.isArray(selectedDisplay.options)"
				:fields="selectedDisplay.options"
				primary-key="+"
				v-model="fieldData.meta.display_options"
			/>

			<component
				v-model="fieldData.meta.display_options"
				:collection="collection"
				:field-data="fieldData"
				:relations="relations"
				:new-fields="newFields"
				:new-collections="newCollections"
				:is="`display-options-${selectedDisplay.id}`"
				v-else
			/>
		</template>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, toRefs } from '@vue/composition-api';
import { getDisplays } from '@/displays';
import { getInterfaces } from '@/interfaces';
import { FancySelectItem } from '@/components/v-fancy-select/types';
import { clone } from 'lodash';

import { state, availableDisplays } from '../store';

export default defineComponent({
	props: {
		type: {
			type: String,
			required: true,
		},
		collection: {
			type: String,
			required: true,
		},
	},
	setup(props, { emit }) {
		const { displays } = getDisplays();
		const { interfaces } = getInterfaces();

		const selectedInterface = computed(() => {
			return interfaces.value.find((inter) => inter.id === state.fieldData.meta.interface);
		});

		const selectItems = computed(() => {
			let recommended = clone(selectedInterface.value?.recommendedDisplays) || [];

			recommended.push('raw', 'formatted-value');
			recommended = [...new Set(recommended)];

			const displayItems: FancySelectItem[] = availableDisplays.value.map((display) => {
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

			const recommendedList = recommended.map((key) => displayItems.find((item) => item.value === key));
			if (recommendedList !== undefined) {
				recommendedItems.push(...recommendedList.filter((i) => i));
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

		const selectedDisplay = computed(() => {
			return displays.value.find((display) => display.id === state.fieldData.meta.display);
		});

		const { fieldData, relations, newCollections, newFields } = toRefs(state);

		return { fieldData, selectItems, selectedDisplay, relations, newCollections, newFields };
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
