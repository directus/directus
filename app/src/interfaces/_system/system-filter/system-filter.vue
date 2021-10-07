<template>
	<div class="system-filter">
		<v-list :mandatory="true" :class="{ empty: innerValue.length === 0 }">
			<div v-if="innerValue.length === 0" class="no-rules">
				{{ t('interfaces.filter.no_rules') }}
			</div>
			<nodes
				v-else
				v-model:filter="innerValue"
				:collection="collectionName"
				:depth="1"
				@remove-node="removeNode($event)"
			/>
		</v-list>
		<div class="buttons">
			<v-select
				inline
				item-text="name"
				item-value="key"
				placement="bottom-start"
				class="add-filter"
				:placeholder="t('interfaces.filter.add_filter')"
				:full-width="false"
				:model-value="null"
				:items="fieldOptions"
				:mandatory="false"
				:groups-clickable="true"
				@group-toggle="loadFieldRelations($event.value, 1)"
				@update:modelValue="addNode($event)"
			/>
		</div>
	</div>
</template>

<script lang="ts">
import { get, set, isEmpty } from 'lodash';
import { defineComponent, PropType, computed, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import { Filter, FieldFilter } from '@directus/shared/types';
import Nodes from './nodes.vue';
import { getNodeName } from './utils';
import { useFieldTree } from '@/composables/use-field-tree';

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
	},
	emits: ['input'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const { collectionName } = toRefs(props);

		const { treeList, loadFieldRelations } = useFieldTree(collectionName);

		const innerValue = computed<Filter[]>({
			get() {
				if (!props.value || isEmpty(props.value)) return [];

				const name = getNodeName(props.value);

				if (name === '_and') {
					return props.value['_and'];
				} else {
					return [props.value];
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

		return { t, addNode, removeNode, innerValue, fieldOptions, loadFieldRelations };

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

				set(filterObj, key, { _eq: null });

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
		display: flex;
		gap: 10px;
		padding: 0 10px;
		color: var(--primary);
		font-weight: 700;

		.add {
			cursor: pointer;
		}
	}

	.empty {
		display: flex;
		align-items: center;
		height: var(--input-height);
		padding-top: 0;
		padding-bottom: 0;

		.no-rules {
			color: var(--foreground-subdued);
			font-family: var(--family-monospace);
		}
	}
}

.add-filter {
	--v-select-placeholder-color: var(--primary);
}
</style>
