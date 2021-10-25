<template>
	<v-notice v-if="!collectionField && !collection" type="warning">
		{{ t('collection_field_not_setup') }}
	</v-notice>
	<v-notice v-else-if="!collection" type="warning">
		{{ t('select_a_collection') }}
	</v-notice>

	<div v-else class="system-filter" :class="{ inline, empty: innerValue.length === 0 }">
		<v-list :mandatory="true">
			<div v-if="innerValue.length === 0" class="no-rules">
				{{ t('interfaces.filter.no_rules') }}
			</div>
			<nodes
				v-else
				v-model:filter="innerValue"
				:collection="collection"
				:depth="1"
				@remove-node="removeNode($event)"
				@change="emitValue"
			/>
		</v-list>
		<div class="buttons">
			<v-select
				:inline="!inline"
				item-text="name"
				item-value="key"
				placement="bottom-start"
				class="add-filter"
				:placeholder="t('interfaces.filter.add_filter')"
				:full-width="inline"
				:model-value="null"
				:items="fieldOptions"
				:mandatory="false"
				:groups-clickable="true"
				@group-toggle="loadFieldRelations($event.value, 1)"
				@update:modelValue="addNode($event)"
			>
				<template v-if="inline" #prepend>
					<v-icon name="add" small />
				</template>
			</v-select>
		</div>
	</div>
</template>

<script lang="ts">
import { get, set, isEmpty, cloneDeep } from 'lodash';
import { defineComponent, PropType, computed, inject, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Filter, FieldFilter } from '@directus/shared/types';
import Nodes from './nodes.vue';
import { getNodeName } from './utils';
import { useFieldTree } from '@/composables/use-field-tree';
import { getFilterOperatorsForType } from '@directus/shared/utils';
import { useFieldsStore } from '@/stores';
import { ClientFilterOperator } from '@directus/shared/types';

export default defineComponent({
	components: {
		Nodes,
	},
	props: {
		value: {
			type: Object as PropType<Record<string, any>>,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		collectionName: {
			type: String,
			default: null,
		},
		collectionField: {
			type: String,
			default: null,
		},
		// Inline = stylistic rendering without borders. Used inside search-input
		inline: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const values = inject('values', ref<Record<string, any>>({}));

		const collection = computed(() => {
			if (props.collectionName) return props.collectionName;

			return values.value[props.collectionField] ?? null;
		});

		const fieldsStore = useFieldsStore();

		const { treeList, loadFieldRelations } = useFieldTree(collection);

		const innerValue = computed<Filter[]>({
			get() {
				if (!props.value || isEmpty(props.value)) return [];

				const name = getNodeName(props.value);

				if (name === '_and') {
					return cloneDeep(props.value['_and']);
				} else {
					return cloneDeep([props.value]);
				}
			},
			set(newVal) {
				if (newVal.length === 0) {
					emit('input', null);
				} else {
					emit('input', { _and: newVal });
				}
			},
		});

		const fieldOptions = computed(() => {
			return [{ key: '$group', name: t('interfaces.filter.add_group') }, { divider: true }, ...treeList.value];
		});

		return {
			t,
			addNode,
			removeNode,
			innerValue,
			fieldOptions,
			loadFieldRelations,
			emitValue,
			collection,
		};

		function emitValue() {
			if (innerValue.value.length === 0) {
				emit('input', null);
			} else {
				emit('input', { _and: innerValue.value });
			}
		}

		function addNode(key: string) {
			if (key === '$group') {
				innerValue.value = [
					...innerValue.value,
					{
						_and: [],
					},
				];
			} else {
				const filterObj = {};

				const field = fieldsStore.getField(collection.value, key)!;
				const operator = getFilterOperatorsForType(field.type)[0];
				set(filterObj, key, { ['_' + operator]: null });

				innerValue.value = [...innerValue.value, filterObj] as FieldFilter[];
			}
		}

		function removeNode(ids: string[]) {
			const id = ids.pop();

			if (ids.length === 0) {
				innerValue.value = innerValue.value.filter((node, index) => index !== Number(id));
				return;
			}

			let list = get(innerValue.value, ids.join('.')) as Filter[];

			list = list.filter((node, index) => index !== Number(id));

			innerValue.value = set(innerValue.value, ids.join('.'), list);
		}
	},
});
</script>

<style lang="scss" scoped>
.system-filter {
	:deep(ul),
	:deep(li) {
		list-style: none;
	}

	:deep(.group) {
		margin-left: 18px;
		padding-left: 10px;
		border-left: var(--border-width) solid var(--border-subdued);
	}

	.v-list {
		margin: 0px 0px 10px 0px;
		padding: 20px 20px 12px 20px;
		border: var(--border-width) solid var(--border-subdued);

		& > :deep(.group) {
			margin-left: 0px;
			padding-left: 0px;
			border-left: none;
		}
	}

	.buttons {
		padding: 0 10px;
		font-weight: 600;
	}

	&.empty {
		.v-list {
			display: flex;
			align-items: center;
			height: var(--input-height);
			padding-top: 0;
			padding-bottom: 0;
		}

		.no-rules {
			color: var(--foreground-subdued);
			font-family: var(--family-monospace);
		}
	}

	.add-filter {
		--v-select-placeholder-color: var(--primary);
	}

	&.inline {
		.v-list {
			margin: 0;
			padding: 0;
			border: 0;
		}

		&.empty .v-list {
			display: none;
		}

		.buttons {
			margin: 0;
			padding: 0;
		}

		.add-filter {
			width: 100%;

			:deep(.v-input) {
				position: relative;
				width: 100%;
				height: 30px;
				padding: 0;
				background-color: var(--background-page);
				border: var(--border-width) solid var(--border-subdued);
				border-radius: 100px;
				transition: border-color var(--fast) var(--transition);

				.input {
					padding-right: 5px;
					padding-left: 6px;
					background: transparent;
					border: 0;

					.prepend {
						margin-right: 4px;
					}
				}
			}
		}
	}
}
</style>
