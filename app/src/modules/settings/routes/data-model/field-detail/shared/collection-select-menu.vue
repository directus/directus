<template>
	<v-menu :show-arrow="showArrow" :attached="attached" :placement="placement">
		<template #activator="{ toggle, activate, deactivate }">
			<slot name="activator" :toggle="toggle" :activate="activate" :deactivate="deactivate" />
		</template>

		<v-list v-if="filteredCollections?.length > 0 || filteredSystemCollections > 0" class="monospace">
			<v-list-item
				v-for="collection in filteredCollections"
				:key="collection.collection"
				:active="modelValue === collection.collection"
				clickable
				@click="$emit('update:modelValue', collection.collection)"
			>
				<v-list-item-content>
					{{ collection.collection }}
				</v-list-item-content>
			</v-list-item>

			<v-divider v-if="filteredCollections.length > 0 && filteredSystemCollections.length > 0" />

			<v-list-group v-if="filteredSystemCollections.length > 0">
				<template #activator>{{ t('system') }}</template>
				<v-list-item
					v-for="systemCollection in filteredSystemCollections"
					:key="systemCollection.collection"
					:active="modelValue === systemCollection.collection"
					clickable
					@click="$emit('update:modelValue', systemCollection.collection)"
				>
					<v-list-item-content>
						{{ systemCollection.collection }}
					</v-list-item-content>
				</v-list-item>
			</v-list-group>
		</v-list>
	</v-menu>
</template>

<script lang="ts" setup>
import type { Collection } from '@/types/collections';
import type { Placement } from '@popperjs/core';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
	defineProps<{
		showArrow?: boolean;
		attached?: boolean;
		placement?: Placement;
		collections: Collection[];
		systemCollections: Collection[];
		filter?: string | null;
		modelValue: string;
	}>(),
	{
		showArrow: false,
		attached: false,
		placement: 'bottom',
		filter: null,
	}
);

defineEmits<{
	(e: 'update:modelValue', collection: Collection): void;
}>();

const { t } = useI18n();

const filteredCollections = computed(() =>
	props.filter ? props.collections.filter(({ collection }) => collection.startsWith(props.filter!)) : props.collections
);
const filteredSystemCollections = computed(() =>
	props.filter
		? props.systemCollections.filter(({ collection }) => collection.startsWith(props.filter!))
		: props.systemCollections
);
</script>

<style lang="scss" scoped>
.monospace {
	--v-list-item-content-font-family: var(--family-monospace);
}
</style>
