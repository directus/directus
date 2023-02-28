<template>
	<value-null v-if="!relatedCollection" />
	<v-menu
		v-else-if="localType && ['o2m', 'm2m', 'm2a', 'translations', 'files'].includes(localType.toLowerCase())"
		show-arrow
		:disabled="value.length === 0"
	>
		<template #activator="{ toggle }">
			<span class="toggle" :class="{ subdued: value.length === 0 }" @click.stop="toggle">
				<span class="label">
					{{ value.length }}
					<template v-if="value.length >= 100">+</template>
					{{ unit }}
				</span>
			</span>
		</template>

		<v-list class="links">
			<v-list-item
				v-for="item in value"
				:key="
					collectionField
						? item[primaryKeyFieldPaths[item[collectionField]]]
						: item[primaryKeyFieldPaths[relatedCollection as string]]
				"
			>
				<v-list-item-content>
					<render-template
						:template="getTemplate(item)"
						:item="item"
						:collection="junctionCollection ?? relatedCollection"
					/>
				</v-list-item-content>
				<v-list-item-icon>
					<router-link :to="getLinkForItem(item)"><v-icon name="launch" small /></router-link>
				</v-list-item-icon>
			</v-list-item>
		</v-list>
	</v-menu>
	<render-template v-else :template="getTemplate(value)" :item="value" :collection="relatedCollection" />
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, computed, PropType } from 'vue';
import { getRelatedCollection } from '@/utils/get-related-collection';
import { useFieldsStore } from '@/stores/fields';
import { getLocalTypeForField } from '@/utils/get-local-type';
import { get } from 'lodash';
import { useCollectionsStore } from '@/stores/collections';
import { Field } from '@directus/shared/types';

export default defineComponent({
	props: {
		collection: {
			type: String,
			required: true,
		},
		field: {
			type: String,
			required: true,
		},
		value: {
			type: [Array, Object] as PropType<Record<string, any> | Record<string, any>[]>,
			default: null,
		},
		template: {
			type: [String, Object] as PropType<string | Record<string, string>>,
			default: null,
		},
	},
	setup(props) {
		const { t, te } = useI18n();
		const fieldsStore = useFieldsStore();
		const collectionsStore = useCollectionsStore();

		const relatedCollectionData = computed(() => {
			return getRelatedCollection(props.collection, props.field);
		});

		const relatedCollection = computed(() => {
			return relatedCollectionData.value?.relatedCollection;
		});

		const junctionCollection = computed(() => {
			return relatedCollectionData.value?.junctionCollection;
		});

		const path = computed(() => {
			return relatedCollectionData.value?.path;
		});

		const collectionField = computed(() => {
			return relatedCollectionData.value?.collectionField;
		});

		const localType = computed(() => {
			return getLocalTypeForField(props.collection, props.field);
		});

		const primaryKeyFields = computed(() =>
			Array.isArray(relatedCollection.value)
				? (relatedCollection.value
						.map((collection) => fieldsStore.getPrimaryKeyFieldForCollection(collection))
						.filter((f) => f != null) as Field[])
				: ([fieldsStore.getPrimaryKeyFieldForCollection(relatedCollection.value!)] as Field[])
		);

		const primaryKeyFieldPaths = computed(() => {
			const initialValue = {} as Record<string, string>;

			return primaryKeyFields.value.reduce((obj, pkField) => {
				return {
					...obj,
					[pkField!.collection]: path.value ? [path.value, pkField?.field].join('.') : pkField?.field,
				};
			}, initialValue);
		});

		const unit = computed(() => {
			if (Array.isArray(props.value)) {
				if (props.value.length === 1) {
					if (!Array.isArray(relatedCollection.value) && te(`collection_names_singular.${relatedCollection.value}`)) {
						return t(`collection_names_singular.${relatedCollection.value}`);
					} else {
						return t('item');
					}
				} else {
					if (!Array.isArray(relatedCollection.value) && te(`collection_names_plural.${relatedCollection.value}`)) {
						return t(`collection_names_plural.${relatedCollection.value}`);
					} else {
						return t('items');
					}
				}
			}

			return null;
		});

		return {
			relatedCollection,
			junctionCollection,
			primaryKeyFieldPaths,
			collectionField,
			getLinkForItem,
			getTemplate,
			unit,
			localType,
		};

		function getLinkForItem(item: any) {
			if (!relatedCollectionData.value || !primaryKeyFields.value || primaryKeyFields.value.length === 0) return '';
			if (collectionField.value) {
				const itemCollection = item[collectionField.value];
				const pkFieldPath = primaryKeyFieldPaths.value[itemCollection];
				if (pkFieldPath) {
					const primaryKey = get(item, pkFieldPath);
					return `/content/${itemCollection}/${encodeURIComponent(primaryKey)}`;
				}
			} else {
				const primaryKey = get(item, primaryKeyFieldPaths.value[relatedCollection.value as string]!);
				return `/content/${relatedCollection.value as string}/${encodeURIComponent(primaryKey)}`;
			}
			return '';
		}

		function getTemplate(item: any): string {
			if (Array.isArray(relatedCollection.value) && collectionField.value && typeof props.template === 'object') {
				return (
					props.template[item[collectionField.value]] ?? getDefaultTemplateForCollection(item[collectionField.value])
				);
			}
			return (props.template as string) ?? getDefaultTemplateForCollection(relatedCollection.value as string);
		}

		function getDefaultTemplateForCollection(collection: string): string {
			const col = collectionsStore.getCollection(collection);
			if (col?.meta?.display_template) {
				return col.meta.display_template;
			} else {
				const pkFieldPath = primaryKeyFieldPaths.value[collection];
				return `{{${pkFieldPath}}}`;
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.toggle {
	position: relative;

	&::before {
		position: absolute;
		top: -6px;
		left: -6px;
		z-index: 1;
		width: calc(100% + 12px);
		height: calc(100% + 12px);
		background-color: var(--background-normal);
		border-radius: var(--border-radius);
		opacity: 0;
		transition: opacity var(--fast) var(--transition);
		content: '';
	}

	.label {
		position: relative;
		z-index: 2;
	}

	&:not(.subdued):hover::before {
		opacity: 1;
	}

	&:not(.subdued):active::before {
		background-color: var(--background-normal-alt);
	}
}

.subdued {
	color: var(--foreground-subdued);
}

.links {
	.v-list-item-content {
		height: var(--v-list-item-min-height);
	}
}
</style>
