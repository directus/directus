<script setup lang="ts">
import { useCollectionsStore } from '@/stores/collections';
import { computed } from 'vue';

const props = defineProps<{
	modelValue?: string;
	disabled?: boolean;
}>();

defineEmits(['update:modelValue']);

const collectionsStore = useCollectionsStore();

const collectionExists = computed(() => {
	return !!collectionsStore.getCollection(props.modelValue);
});

const availableCollections = collectionsStore.databaseCollections.filter((collection) => collection.meta);
const systemCollections = collectionsStore.crudSafeSystemCollections;
</script>

<template>
	<v-input
		key="related-collection-select"
		:model-value="modelValue"
		:class="{ matches: collectionExists }"
		db-safe
		:nullable="false"
		:disabled="disabled"
		:placeholder="$t('collection') + '...'"
		@update:model-value="$emit('update:modelValue', $event)"
	>
		<template v-if="!disabled" #append>
			<v-menu show-arrow placement="bottom-end">
				<template #activator="{ toggle }">
					<v-icon v-tooltip="$t('select_existing')" name="list_alt" clickable :disabled="disabled" @click="toggle" />
				</template>

				<v-list class="monospace">
					<v-list-item
						v-for="availableCollection in availableCollections"
						:key="availableCollection.collection"
						:active="modelValue === availableCollection.collection"
						:disabled="availableCollection.meta?.singleton"
						clickable
						@click="$emit('update:modelValue', availableCollection.collection)"
					>
						<v-list-item-content>
							{{ availableCollection.collection }}
						</v-list-item-content>
					</v-list-item>

					<v-divider />

					<v-list-group>
						<template #activator>{{ $t('system') }}</template>
						<v-list-item
							v-for="systemCollection in systemCollections"
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

		<template v-if="disabled" #input>
			<v-text-overflow :text="modelValue" />
		</template>
	</v-input>
</template>
