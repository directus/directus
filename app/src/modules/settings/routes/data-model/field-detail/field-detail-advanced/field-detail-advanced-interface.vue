<template>
	<div>
		<v-fancy-select v-model="interfaceID" class="select" :items="selectItems" />

		<v-notice v-if="interfaceID && !selectedInterface" class="not-found" type="danger">
			{{ t('interface_not_found', { interface: interfaceID }) }}
			<div class="spacer" />
			<button @click="interfaceID = null">{{ t('reset_interface') }}</button>
		</v-notice>

		<extension-options
			v-if="interfaceID && selectedInterface"
			type="interface"
			:extension="interfaceID"
			show-advanced
		/>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, computed } from 'vue';
import { getInterfaces } from '@/interfaces';
import { FancySelectItem } from '@/components/v-fancy-select/types';
import { InterfaceConfig } from '@directus/shared/types';
import { useFieldDetailStore, syncFieldDetailStoreProperty } from '../store/';
import { storeToRefs } from 'pinia';
import ExtensionOptions from '../shared/extension-options.vue';

export default defineComponent({
	components: { ExtensionOptions },
	setup() {
		const { t } = useI18n();

		const fieldDetailStore = useFieldDetailStore();

		const interfaceID = syncFieldDetailStoreProperty('field.meta.interface');
		const options = syncFieldDetailStoreProperty('field.meta.options');

		const { field, interfacesForType } = storeToRefs(fieldDetailStore);
		const type = computed(() => field.value.type);

		const { interfaces } = getInterfaces();

		const selectItems = computed(() => {
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

			const recommended = recommendedInterfacesPerType[type.value ?? 'alias'] || [];

			const interfaceItems: FancySelectItem[] = interfacesForType.value.map((inter) => {
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
			return interfaces.value.find((inter: InterfaceConfig) => inter.id === interfaceID.value);
		});

		return { t, selectItems, selectedInterface, interfaceID, options };
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
