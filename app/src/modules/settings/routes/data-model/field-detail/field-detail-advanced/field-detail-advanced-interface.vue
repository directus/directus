<script setup lang="ts">
import { FancySelectItem } from '@/components/v-fancy-select.vue';
import { useExtension } from '@/composables/use-extension';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import ExtensionOptions from '../shared/extension-options.vue';
import { syncFieldDetailStoreProperty, useFieldDetailStore } from '../store/';


const fieldDetailStore = useFieldDetailStore();

const interfaceId = syncFieldDetailStoreProperty('field.meta.interface');

const { loading, field, interfacesForType } = storeToRefs(fieldDetailStore);
const type = computed(() => field.value.type);

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

	const recommendedItems: FancySelectItem[] = [];

	const recommendedList = recommended.map((key) => interfaceItems.find((item) => item.value === key));

	if (recommendedList !== undefined) {
		recommendedItems.push(...recommendedList.filter((item): item is FancySelectItem => !!item));
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

const interfaceIsSelectable = computed(
	() => !!selectItems.value.find((selectItem) => selectItem.value === interfaceId.value),
);

const selectedInterface = useExtension('interface', interfaceId);

const customOptionsFields = computed(() => {
	if (typeof selectedInterface.value?.options === 'function') {
		return selectedInterface.value?.options(fieldDetailStore);
	}

	return undefined;
});

const options = computed({
	get() {
		return fieldDetailStore.field.meta?.options ?? {};
	},
	set(newOptions: Record<string, any>) {
		fieldDetailStore.update({
			field: {
				meta: {
					options: newOptions,
				},
			},
		});
	},
});
</script>

<template>
	<div>
		<v-skeleton-loader v-if="loading" />
		<v-fancy-select v-else v-model="interfaceId" class="select" :items="selectItems" />

		<v-skeleton-loader v-if="loading" />
		<template v-else>
			<v-notice v-if="interfaceId && (!selectedInterface || !interfaceIsSelectable)" class="not-found" type="danger">
				{{ $t('interface_not_found', { interface: interfaceId }) }}
				<div class="spacer" />
				<button @click="interfaceId = null">{{ $t('reset_interface') }}</button>
			</v-notice>

			<extension-options
				v-if="interfaceId && selectedInterface && interfaceIsSelectable"
				v-model="options"
				type="interface"
				:options="customOptionsFields"
				:extension="interfaceId"
				show-advanced
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
