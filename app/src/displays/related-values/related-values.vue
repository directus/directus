<template>
	<value-null v-if="!relatedCollection" />
	<v-menu
		v-else-if="['o2m', 'm2m', 'm2a', 'translations', 'files'].includes(type.toLowerCase())"
		show-arrow
		:disabled="value.length === 0"
	>
		<template #activator="{ toggle }">
			<span @click.stop="toggle" class="toggle" :class="{ subdued: value.length === 0 }">
				<span class="label">
					{{ value.length }}
					<template v-if="value.length >= 100">+</template>
					{{ unit }}
				</span>
			</span>
		</template>

		<v-list class="links">
			<v-list-item v-for="item in value" :key="item[primaryKeyField]" :to="getLinkForItem(item)">
				<v-list-item-content>
					<render-template :template="_template" :item="item" :collection="relatedCollection" />
				</v-list-item-content>
				<v-list-item-icon>
					<v-icon name="launch" small />
				</v-list-item-icon>
			</v-list-item>
		</v-list>
	</v-menu>
	<render-template v-else :template="_template" :item="value" :collection="relatedCollection" />
</template>

<script lang="ts">
import { defineComponent, computed, PropType, Ref } from '@vue/composition-api';
import getRelatedCollection from '@/utils/get-related-collection';
import useCollection from '@/composables/use-collection';
import ValueNull from '@/views/private/components/value-null';
import { i18n } from '@/lang';

export default defineComponent({
	components: { ValueNull },
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
			type: [Array, Object] as PropType<any | any[]>,
			default: null,
		},
		template: {
			type: String,
			default: null,
		},
		type: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const relatedCollection = computed(() => {
			return getRelatedCollection(props.collection, props.field);
		});

		const primaryKeyField = computed(() => {
			if (relatedCollection.value !== null) {
				return useCollection(relatedCollection as Ref<string>).primaryKeyField.value;
			}
		});

		const _template = computed(() => {
			return props.template || `{{ ${primaryKeyField.value!.field} }}`;
		});

		const unit = computed(() => {
			if (Array.isArray(props.value)) {
				if (props.value.length === 1) {
					if (i18n.te(`collection_names_singular.${relatedCollection.value}`)) {
						return i18n.t(`collection_names_singular.${relatedCollection.value}`);
					} else {
						return i18n.t('item');
					}
				} else {
					if (i18n.te(`collection_names_plural.${relatedCollection.value}`)) {
						return i18n.t(`collection_names_plural.${relatedCollection.value}`);
					} else {
						return i18n.t('items');
					}
				}
			}
		});

		return { relatedCollection, primaryKeyField, getLinkForItem, _template, unit };

		function getLinkForItem(item: any) {
			if (!relatedCollection.value || !primaryKeyField.value) return null;
			const primaryKey = item[primaryKeyField.value.field];

			return `/collections/${relatedCollection.value}/${encodeURIComponent(primaryKey)}`;
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
