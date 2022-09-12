<template>
	<v-input
		key="related-collection-select"
		:model-value="modelValue"
		:class="{ matches: collectionExists }"
		db-safe
		:nullable="false"
		:disabled="disabled"
		:placeholder="t('collection') + '...'"
		@update:model-value="$emit('update:modelValue', $event)"
	>
		<template v-if="!disabled" #append>
			<v-menu show-arrow placement="bottom-end">
				<template #activator="{ toggle }">
					<v-icon v-tooltip="t('select_existing')" name="list_alt" clickable :disabled="disabled" @click="toggle" />
				</template>

				<v-list class="monospace">
					<v-list-item
						v-for="availableCollection in availableCollections"
						:key="availableCollection.collection"
						:active="modelValue === availableCollection.collection"
						clickable
						@click="$emit('update:modelValue', availableCollection.collection)"
					>
						<v-list-item-content>
							{{ availableCollection.collection }}
						</v-list-item-content>
					</v-list-item>

					<v-divider />

					<v-list-group>
						<template #activator>{{ t('system') }}</template>
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

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCollectionsStore } from '@/stores/collections';
import { orderBy } from 'lodash';

export default defineComponent({
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
	setup(props) {
		const { t } = useI18n();
		const collectionsStore = useCollectionsStore();

		const collectionExists = computed(() => {
			return !!collectionsStore.getCollection(props.modelValue);
		});

		const availableCollections = computed(() => {
			return orderBy(collectionsStore.databaseCollections, ['sort', 'collection'], ['asc']);
		});

		const systemCollections = collectionsStore.crudSafeSystemCollections;

		return { t, collectionExists, availableCollections, systemCollections };
	},
});
</script>
