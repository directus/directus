<template>
	<collection-select-menu
		attached
		:collections="availableCollections"
		:system-collections="systemCollections"
		:model-value="modelValue"
		:filter="modelValue"
		@update:model-value="emitValue($event)"
	>
		<template #activator="{ activate, deactivate: deactivateSuggestions }">
			<v-input
				key="related-collection-select"
				:model-value="modelValue"
				:class="{ matches: collectionExists }"
				db-safe
				:nullable="false"
				:disabled="disabled"
				:placeholder="t('collection') + '...'"
				@focus="activate"
				@update:model-value="emitValue($event)"
			>
				<template v-if="!disabled" #append>
					<collection-select-menu
						show-arrow
						placement="bottom-end"
						:collections="availableCollections"
						:system-collections="systemCollections"
						:model-value="modelValue"
						@update:model-value="emitValue($event)"
					>
						<template #activator="{ toggle }">
							<v-icon
								v-tooltip="t('select_existing')"
								name="list_alt"
								clickable
								:disabled="disabled"
								@click="
									toggle();
									deactivateSuggestions();
								"
							/>
						</template>
					</collection-select-menu>
				</template>

				<template v-if="disabled" #input>
					<v-text-overflow :text="modelValue" />
				</template>
			</v-input>
		</template>
	</collection-select-menu>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCollectionsStore } from '@/stores/collections';
import { orderBy } from 'lodash';
import CollectionSelectMenu from './collection-select-menu.vue';

export default defineComponent({
	components: { CollectionSelectMenu },
	props: {
		modelValue: {
			type: String,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const { t } = useI18n();
		const collectionsStore = useCollectionsStore();

		const collectionExists = computed(() => {
			return !!collectionsStore.getCollection(props.modelValue);
		});

		const availableCollections = computed(() => {
			return orderBy(collectionsStore.databaseCollections, ['sort', 'collection'], ['asc']);
		});

		const systemCollections = collectionsStore.crudSafeSystemCollections;

		const emitValue = (collection: string) => emit('update:modelValue', collection);

		return { t, collectionExists, availableCollections, systemCollections, emitValue };
	},
});
</script>

<style lang="scss" scoped>
.v-input.matches {
	--v-input-color: var(--primary);
}
</style>
