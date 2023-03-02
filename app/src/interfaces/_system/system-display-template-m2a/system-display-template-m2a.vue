<template>
	<div class="system-display-template">
		<v-notice v-if="collectionName === null" type="info">
			{{ t('interfaces.system-display-template.select_a_collection') }}
		</v-notice>

		<template v-else>
			<template v-for="collection in allowedCollectionsInfo" :key="collection.collection">
				<v-text-overflow :text="collection.name" />
				<v-field-template
					:collection="collectionName"
					:m2a-collection-field="collectionField"
					:m2a-collection-scope="collection.collection"
					:model-value="internalValue[collection.collection]"
					:disabled="disabled"
					:inject="{ fields: injectedFields }"
					@update:model-value="handleUpdate(collection.collection, $event)"
				/>
			</template>
		</template>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, inject, ref, computed, PropType, toRefs } from 'vue';
import { useCollectionsStore } from '@/stores/collections';
import { Collection } from '@/types/collections';
import { Field } from '@directus/shared/types';

export default defineComponent({
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
		value: {
			type: Object as PropType<Record<string, string>>,
			default: null,
		},
		collectionField: {
			type: String,
			required: true,
		},
		allowedCollections: {
			type: Array as PropType<string[]>,
			required: true,
		},
		collectionName: {
			type: String,
			required: true,
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		const { t } = useI18n();
		const { allowedCollections, collectionField, collectionName } = toRefs(props);

		const internalValue = computed({
			get: () => {
				if (typeof props.value === 'string' || !props.value) {
					let obj = {} as Record<string, string>;
					for (let col of allowedCollections.value) {
						obj[col] = props.value;
					}
					return obj;
				}
				return props.value;
			},
			set: (val) => {
				emit('input', val);
			},
		});

		const collectionsStore = useCollectionsStore();

		const allowedCollectionsInfo = computed<Collection[]>(
			() =>
				allowedCollections.value
					.map((collection) => collectionsStore.getCollection(collection))
					.filter((collection) => collection != null) as Collection[]
		);

		const handleUpdate = (collection: string, event: string) => {
			internalValue.value = { ...internalValue.value, [collection]: event };
		};

		// TODO: move to gettree for nested m2as

		const injectedFields = computed(() => {
			const singularField: Field = {
				name: `${t('field_options.directus_collections.collection_name')} (${t(
					'field_options.directus_collections.singular_unit'
				)})`,
				collection: collectionName.value,
				field: `$collection_name_singular`,
				type: 'string',
				schema: null,
				meta: null,
			};
			const pluralField: Field = {
				name: `${t('field_options.directus_collections.collection_name')} (${t(
					'field_options.directus_collections.plural_unit'
				)})`,
				collection: collectionName.value,
				field: `$collection_name_plural`,
				type: 'string',
				schema: null,
				meta: null,
			};
			const itemDefaultField: Field = {
				name: `${t('item')} (${t('default_label')} ${t('fields.directus_collections.display_template')})`,
				collection: collectionName.value,
				field: `$item_default_display_template`,
				type: 'string',
				schema: null,
				meta: null,
			};
			return [singularField, pluralField, itemDefaultField];
		});

		return { t, allowedCollectionsInfo, handleUpdate, internalValue, injectedFields };
	},
});
</script>
<style lang="scss" scoped>
.system-display-template {
	::v-deep(.v-text-overflow) {
		margin-bottom: 8px;
	}

	::v-deep(.v-input) {
		margin-bottom: 16px;
	}
}
</style>
