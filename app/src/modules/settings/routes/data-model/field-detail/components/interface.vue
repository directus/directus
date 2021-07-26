<template>
	<div>
		<v-fancy-select v-model="fieldData.meta.interface" class="select" :items="selectItems" />

		<v-notice v-if="fieldData.meta.interface && !selectedInterface" class="not-found" type="danger">
			{{ t('interface_not_found', { interface: fieldData.meta.interface }) }}
			<div class="spacer" />
			<button @click="fieldData.meta.interface = null">{{ t('reset_interface') }}</button>
		</v-notice>

		<template v-if="fieldData.meta.interface && selectedInterface">
			<v-notice v-if="!selectedInterface.options || selectedInterface.options.length === 0">
				{{ t('no_options_available') }}
			</v-notice>

			<v-form
				v-else-if="Array.isArray(selectedInterface.options)"
				v-model="fieldData.meta.options"
				:fields="selectedInterface.options"
				primary-key="+"
			/>

			<component
				:is="`interface-options-${selectedInterface.id}`"
				v-else
				:value="fieldData.meta.options"
				:collection="collection"
				:field-data="fieldData"
				:relations="relations"
				:new-fields="newFields"
				:new-collections="newCollections"
				@input="fieldData.meta.options = $event"
			/>
		</template>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, computed, toRefs } from 'vue';
import { getInterfaces } from '@/interfaces';
import { FancySelectItem } from '@/components/v-fancy-select/types';

import { state, availableInterfaces } from '../store';
import { InterfaceConfig } from '@directus/shared/types';

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
	setup() {
		const { t } = useI18n();

		const { interfaces } = getInterfaces();

		const selectItems = computed(() => {
			const type: string = state.fieldData?.type || 'alias';

			const recommendedInterfacesPerType: { [type: string]: string[] } = {
				string: ['input', 'select-dropdown'],
				text: ['input-rich-text-html'],
				boolean: ['boolean'],
				integer: ['input'],
				bigInteger: ['input'],
				float: ['input'],
				decimal: ['input'],
				timestamp: ['datetime'],
				datetime: ['datetime'],
				date: ['datetime'],
				time: ['datetime'],
				json: ['select-multiple-checkbox', 'tags'],
				uuid: ['input'],
				csv: ['tags'],
			};

			const recommended = recommendedInterfacesPerType[type] || [];

			const interfaceItems: FancySelectItem[] = availableInterfaces.value.map((inter) => {
				const item: FancySelectItem = {
					text: inter.name,
					description: inter.description,
					value: inter.id,
					icon: inter.icon,
				};

				if (recommended.includes(item.value as string)) {
					item.iconRight = 'star';
				}

				return item;
			});

			const recommendedItems: (FancySelectItem | { divider: boolean } | undefined)[] = [];

			const recommendedList = recommended.map((key) => interfaceItems.find((item) => item.value === key));
			if (recommendedList !== undefined) {
				recommendedItems.push(...recommendedList.filter((i) => i));
			}

			if (interfaceItems.length >= 5 && recommended.length > 0) {
				recommendedItems.push({ divider: true });
			}

			const interfaceList = interfaceItems.filter((item) => recommended.includes(item.value as string) === false);
			if (interfaceList !== undefined) {
				recommendedItems.push(...interfaceList.filter((i) => i));
			}

			return recommendedItems;
		});

		const selectedInterface = computed(() => {
			return interfaces.value.find((inter: InterfaceConfig) => inter.id === state.fieldData.meta?.interface);
		});

		const { fieldData, relations, newCollections, newFields } = toRefs(state);

		return { t, fieldData, relations, selectItems, selectedInterface, newCollections, newFields };
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
