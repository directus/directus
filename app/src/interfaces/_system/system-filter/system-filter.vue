<template>
	<v-notice v-if="!collectionField && !collection" type="warning">
		{{ t('collection_field_not_setup') }}
	</v-notice>
	<v-notice v-else-if="!collection" type="warning">
		{{ t('select_a_collection') }}
	</v-notice>

	<div v-else class="system-filter" :class="{ inline, empty: innerValue.length === 0, field }">
		<v-list :mandatory="true">
			<div v-if="innerValue.length === 0" class="no-rules">
				{{ t('interfaces.filter.no_rules') }}
			</div>

			<nodes
				v-else
				v-model:filter="innerValue"
				:collection="collection"
				:field="field"
				:depth="1"
				:include-validation="includeValidation"
				@remove-node="removeNode($event)"
				@change="emitValue"
			/>
		</v-list>

		<div v-if="field" class="buttons">
			<button @click="addNode(field!)">{{ t('interfaces.filter.add_filter') }}</button>
			<button @click="addNode('$group')">{{ t('interfaces.filter.add_group') }}</button>
		</div>

		<div v-else class="buttons">
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
				@group-toggle="loadFieldRelations($event.value)"
				@update:modelValue="addNode($event)"
			>
				<template v-if="inline" #prepend>
					<v-icon name="add" small />
				</template>
			</v-select>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { get, set, isEmpty, cloneDeep } from 'lodash';
import { computed, inject, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Filter } from '@directus/shared/types';
import Nodes from './nodes.vue';
import { getNodeName } from './utils';
import { useFieldTree } from '@/composables/use-field-tree';
import { getFilterOperatorsForType } from '@directus/shared/utils';
import { useFieldsStore } from '@/stores';

interface Props {
	value?: Record<string, any>;
	disabled?: boolean;
	collectionName?: string;
	collectionField?: string;
	field?: string;
	inline?: boolean;
	includeValidation?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	value: undefined,
	disabled: false,
	collectionName: undefined,
	collectionField: undefined,
	field: undefined,
	inline: false,
	includeValidation: false,
});

const emit = defineEmits(['input']);

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

function emitValue() {
	if (innerValue.value.length === 0) {
		emit('input', null);
	} else {
		emit('input', { _and: innerValue.value });
	}
}

function addNode(key: string) {
	if (key === '$group') {
		innerValue.value = innerValue.value.concat({ _and: [] });
	} else {
		const field = fieldsStore.getField(collection.value, key)!;
		const operator = getFilterOperatorsForType(field.type)[0];
		const node = set({}, key, { ['_' + operator]: null });
		innerValue.value = innerValue.value.concat(node);
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
		min-width: auto;
		margin: 0px 0px 10px;
		padding: 20px 20px 12px;
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

.field .buttons {
	button {
		color: var(--primary);
		display: inline-block;
		cursor: pointer;
	}

	button + button {
		margin-left: 24px;
	}
}
</style>
