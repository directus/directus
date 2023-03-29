<template>
	<value-null v-if="!relatedCollection" />
	<v-menu
		v-else-if="['o2m', 'm2m', 'm2a', 'translations', 'files'].includes(localType.toLowerCase())"
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
			<v-list-item v-for="item in value" :key="item[primaryKeyFieldPath]">
				<v-list-item-content>
					<render-template
						:template="internalTemplate"
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
	<render-template v-else :template="internalTemplate" :item="value" :collection="relatedCollection" />
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, computed, PropType } from 'vue';
import { getRelatedCollection } from '@/utils/get-related-collection';
import { useCollection } from '@directus/shared/composables';
import { getLocalTypeForField } from '@/utils/get-local-type';
import { get } from 'lodash';

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
			type: String,
			default: null,
		},
	},
	setup(props) {
		const { t, te } = useI18n();

		const relatedCollectionData = computed(() => {
			return getRelatedCollection(props.collection, props.field);
		});

		const relatedCollection = computed(() => {
			return relatedCollectionData.value.relatedCollection;
		});

		const junctionCollection = computed(() => {
			return relatedCollectionData.value.junctionCollection;
		});

		const localType = computed(() => {
			return getLocalTypeForField(props.collection, props.field);
		});

		const { primaryKeyField } = useCollection(relatedCollection);

		const primaryKeyFieldPath = computed(() => {
			return relatedCollectionData.value.path
				? [...relatedCollectionData.value.path, primaryKeyField.value?.field].join('.')
				: primaryKeyField.value?.field;
		});

		const internalTemplate = computed(() => {
			return props.template || `{{ ${primaryKeyFieldPath.value!} }}`;
		});

		const unit = computed(() => {
			if (Array.isArray(props.value)) {
				if (props.value.length === 1) {
					if (te(`collection_names_singular.${relatedCollection.value}`)) {
						return t(`collection_names_singular.${relatedCollection.value}`);
					} else {
						return t('item');
					}
				} else {
					if (te(`collection_names_plural.${relatedCollection.value}`)) {
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
			primaryKeyFieldPath,
			getLinkForItem,
			internalTemplate,
			unit,
			localType,
		};

		function getLinkForItem(item: any) {
			if (!relatedCollectionData.value || !primaryKeyFieldPath.value) return null;
			const primaryKey = get(item, primaryKeyFieldPath.value);

			return `/content/${relatedCollection.value}/${encodeURIComponent(primaryKey)}`;
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
