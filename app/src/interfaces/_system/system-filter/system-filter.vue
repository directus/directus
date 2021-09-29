<template>
	<div class="system-filter">
		<v-list :mandatory="true">
			<div v-if="innerValue.length === 0" class="no-rules">
				{{ t('interfaces.filter.no_rules') }}
			</div>
			<nodes
				v-else
				v-model:filter="innerValue"
				:collection="collectionName"
				:depth="1"
				@add-node="addNode($event)"
				@remove-node="removeNode($event)"
			/>
		</v-list>
		<div class="buttons">
			<div class="add" @click="addNode('field')">
				{{ t('interfaces.filter.add_filter') }}
			</div>
			<div class="add" @click="addNode('logic')">
				{{ t('interfaces.filter.add_group') }}
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { useFieldsStore } from '@/stores';
import { get, set } from 'lodash';
import { defineComponent, PropType, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Filter } from '@directus/shared/types';
import Nodes from './nodes.vue';
import { getNodeName } from './utils';

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
		const fieldsStore = useFieldsStore();

		const innerValue = computed<Filter[]>({
			get() {
				if (!props.value) return [];

				const name = getNodeName(props.value);

				if (name === '_and') {
					return props.value['_and'];
				} else {
					return [props.value];
				}
			},
			set(newVal) {
				emit('input', { _and: newVal });
			},
		});

		return { t, addNode, removeNode, innerValue };

		function addNode(type: 'logic' | 'field') {
			if (type === 'logic') {
				innerValue.value = [
					...innerValue.value,
					{
						_and: [],
					},
				];
			} else {
				const pkField = fieldsStore.getPrimaryKeyFieldForCollection(props.collectionName).field;
				innerValue.value = [
					...innerValue.value,
					{
						[pkField]: {
							_eq: 0,
						},
					},
				];
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

		.no-rules {
			margin-bottom: 8px;
			color: var(--foreground-subdued);
			font-family: var(--family-monospace);
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
}
</style>
