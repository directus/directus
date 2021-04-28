<template>
	<v-drawer v-model="_active" :title="title" persistent @cancel="cancel">
		<template #title v-if="template !== null && templateData && primaryKey !== '+'">
			<v-skeleton-loader class="title-loader" type="text" v-if="loading || templateDataLoading" />

			<h1 class="type-title" v-else>
				<render-template :collection="templateCollection.collection" :item="templateData" :template="template" />
			</h1>
		</template>

		<template #subtitle>
			<v-breadcrumb :items="[{ name: collectionInfo.name, disabled: true }]" />
		</template>

		<template #actions>
			<v-button @click="save" icon rounded v-tooltip.bottom="$t('save')">
				<v-icon name="check" />
			</v-button>
		</template>

		<div class="drawer-item-content">
			<template v-if="junctionField">
				<file-preview
					v-if="file"
					:src="file.src"
					:mime="file.type"
					:width="file.width"
					:height="file.height"
					:title="file.title"
					:inModal="true"
				/>

				<v-form
					:loading="loading"
					:initial-values="item && item[junctionField]"
					:primary-key="relatedPrimaryKey"
					:edits="_edits[junctionField]"
					:fields="junctionRelatedCollectionFields"
					@input="setJunctionEdits"
				/>

				<v-divider v-if="showDivider" />
			</template>

			<v-form :loading="loading" :initial-values="item" :primary-key="primaryKey" :fields="fields" v-model="_edits" />
		</div>
	</v-drawer>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType, watch, toRefs } from '@vue/composition-api';
import api, { addTokenToURL } from '@/api';
import { getRootPath } from '@/utils/get-root-path';
import FilePreview from '@/views/private/components/file-preview';

import useCollection from '@/composables/use-collection';
import { useFieldsStore, useRelationsStore } from '@/stores';
import i18n from '@/lang';
import { Relation, Field } from '@/types';
import { unexpectedError } from '@/utils/unexpected-error';
import { usePermissions } from '@/composables/use-permissions';
import useTemplateData from '@/composables/use-template-data';

export default defineComponent({
	components: { FilePreview },

	model: {
		prop: 'edits',
	},
	props: {
		active: {
			type: Boolean,
			default: false,
		},
		collection: {
			type: String,
			required: true,
		},
		primaryKey: {
			type: [String, Number],
			required: true,
		},
		edits: {
			type: Object as PropType<Record<string, any>>,
			default: undefined,
		},
		junctionField: {
			type: String,
			default: null,
		},
		// There's an interesting case where the main form can be a newly created item ('+'), while
		// it has a pre-selected related item it needs to alter. In that case, we have to fetch the
		// related data anyway.
		relatedPrimaryKey: {
			type: [String, Number],
			default: '+',
		},

		// If this drawer-item is opened from a relational interface, we need to force-block the field
		// that relates back to the parent item.
		circularField: {
			type: String,
			default: null,
		},
	},
	setup(props, { emit }) {
		const fieldsStore = useFieldsStore();
		const relationsStore = useRelationsStore();

		const { _active } = useActiveState();
		const {
			junctionFieldInfo,
			junctionRelatedCollection,
			junctionRelatedCollectionInfo,
			setJunctionEdits,
		} = useJunction();
		const { _edits, loading, item } = useItem();
		const { save, cancel } = useActions();

		const { collection } = toRefs(props);

		const { info: collectionInfo } = useCollection(collection);

		const title = computed(() => {
			const collection = junctionRelatedCollectionInfo?.value || collectionInfo.value!;
			const isNew = props.primaryKey === '+';

			if (i18n.te(`collection_names_singular.${collection.collection}`)) {
				return isNew
					? i18n.t('creating_unit', { unit: i18n.t(`collection_names_singular.${collection.collection}`) })
					: i18n.t('editing_unit', { unit: i18n.t(`collection_names_singular.${collection.collection}`) });
			}

			return isNew
				? i18n.t('creating_in', { collection: collection.name })
				: i18n.t('editing_in', { collection: collection.name });
		});

		const showDivider = computed(() => {
			return (
				fieldsStore.getFieldsForCollection(props.collection).filter((field: Field) => field.meta?.hidden !== true)
					.length > 0
			);
		});

		const { fields: junctionRelatedCollectionFields } = usePermissions(
			junctionRelatedCollection,
			computed(() => item.value && item.value[props.junctionField]),
			computed(() => props.primaryKey === '+')
		);

		const { fields: fieldsWithPermissions } = usePermissions(
			collection,
			item,
			computed(() => props.primaryKey === '+')
		);

		const fields = computed(() => {
			if (props.circularField) {
				return fieldsWithPermissions.value.filter((field) => {
					return field.field !== props.circularField;
				});
			} else {
				return fieldsWithPermissions.value;
			}
		});

		const templatePrimaryKey = computed(() =>
			junctionFieldInfo.value ? String(props.relatedPrimaryKey) : String(props.primaryKey)
		);

		const templateCollection = computed(() => junctionRelatedCollectionInfo.value || collectionInfo.value);
		const { templateData, loading: templateDataLoading } = useTemplateData(templateCollection, templatePrimaryKey);

		const template = computed(
			() =>
				junctionRelatedCollectionInfo.value?.meta?.display_template ||
				collectionInfo.value?.meta?.display_template ||
				null
		);

		const { file } = useFile();

		return {
			_active,
			_edits,
			loading,
			item,
			save,
			cancel,
			title,
			junctionFieldInfo,
			junctionRelatedCollection,
			setJunctionEdits,
			showDivider,
			junctionRelatedCollectionFields,
			fields,
			template,
			templateCollection,
			templatePrimaryKey,
			templateData,
			templateDataLoading,
			collectionInfo,
			file,
		};

		function useFile() {
			const file = ref(null);

			watch([() => item.value, () => junctionRelatedCollection.value], () => {
				const junctionItem = item.value;

				if (junctionRelatedCollection.value === 'directus_files') {
					const item = junctionItem?.[props.junctionField];
					const src = addTokenToURL(getRootPath() + `assets/${item.id}?key=system-large-contain`);

					file.value = { ...item, src };
				} else {
					file.value = null;
				}
			});

			return { file };
		}

		function useActiveState() {
			const localActive = ref(false);

			const _active = computed({
				get() {
					return props.active === undefined ? localActive.value : props.active;
				},
				set(newActive: boolean) {
					localActive.value = newActive;
					emit('update:active', newActive);
				},
			});

			return { _active };
		}

		function useItem() {
			const localEdits = ref<Record<string, any>>({});

			const _edits = computed<Record<string, any>>({
				get() {
					if (props.edits !== undefined) {
						return {
							...props.edits,
							...localEdits.value,
						};
					}

					return localEdits.value;
				},
				set(newEdits) {
					localEdits.value = newEdits;
				},
			});

			const loading = ref(false);
			const item = ref<Record<string, any> | null>(null);

			watch(
				() => props.active,
				(isActive) => {
					if (isActive === true) {
						if (props.primaryKey !== '+') fetchItem();
						if (props.relatedPrimaryKey !== '+') fetchRelatedItem();
					} else {
						loading.value = false;
						item.value = null;
						localEdits.value = {};
					}
				},
				{ immediate: true }
			);

			return { _edits, loading, item, fetchItem };

			async function fetchItem() {
				loading.value = true;

				const endpoint = props.collection.startsWith('directus_')
					? `/${props.collection.substring(9)}/${props.primaryKey}`
					: `/items/${props.collection}/${encodeURIComponent(props.primaryKey)}`;

				let fields = '*';

				if (props.junctionField) {
					fields = `*,${props.junctionField}.*`;
				}

				try {
					const response = await api.get(endpoint, { params: { fields } });

					item.value = response.data.data;
				} catch (err) {
					unexpectedError(err);
				} finally {
					loading.value = false;
				}
			}

			async function fetchRelatedItem() {
				loading.value = true;

				const collection = junctionRelatedCollection.value;

				const endpoint = collection.startsWith('directus_')
					? `/${collection.substring(9)}/${props.relatedPrimaryKey}`
					: `/items/${collection}/${encodeURIComponent(props.relatedPrimaryKey)}`;

				try {
					const response = await api.get(endpoint);

					item.value = {
						...(item.value || {}),
						[junctionFieldInfo.value.field]: response.data.data,
					};
				} catch (err) {
					unexpectedError(err);
				} finally {
					loading.value = false;
				}
			}
		}

		function useJunction() {
			const junctionFieldInfo = computed(() => {
				if (!props.junctionField) return null;

				return fieldsStore.getField(props.collection, props.junctionField);
			});

			const junctionRelatedCollection = computed(() => {
				if (!props.junctionField) return null;

				// If this is a m2m/m2a, there will be 2 relations associated with this field
				const relations = relationsStore.getRelationsForField(props.collection, props.junctionField);

				const relationForField = relations.find((relation: Relation) => {
					return relation.many_collection === props.collection && relation.many_field === props.junctionField;
				});

				if (relationForField.one_collection) return relationForField.one_collection;
				if (relationForField.one_collection_field)
					return (
						props.edits[relationForField.one_collection_field] || item.value?.[relationForField.one_collection_field]
					);
				return null;
			});

			const junctionRelatedCollectionInfo = computed(() => {
				if (!junctionRelatedCollection.value) return null;
				const { info } = useCollection(junctionRelatedCollection.value);
				return info.value;
			});

			return { junctionFieldInfo, junctionRelatedCollection, junctionRelatedCollectionInfo, setJunctionEdits };

			function setJunctionEdits(edits: any) {
				if (!props.junctionField) return;

				_edits.value = {
					..._edits.value,
					[props.junctionField]: edits,
				};
			}
		}

		function useActions() {
			return { save, cancel };

			function save() {
				emit('input', _edits.value);
				_active.value = false;
				_edits.value = {};
			}

			function cancel() {
				_active.value = false;
				_edits.value = {};
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.v-divider {
	margin: 52px 0;
}

.drawer-item-content {
	padding: var(--content-padding);
	padding-bottom: var(--content-padding-bottom);
}
</style>
