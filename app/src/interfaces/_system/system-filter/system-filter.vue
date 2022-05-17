<template>
	<v-notice v-if="!collectionField && !collection" type="warning">
		{{ t('collection_field_not_setup') }}
	</v-notice>
	<v-notice v-else-if="!collection" type="warning">
		{{ t('select_a_collection') }}
	</v-notice>

	<div v-else class="system-filter" :class="{ inline, empty: innerValue.length === 0, field: fieldName !== undefined }">
		<v-list :mandatory="true">
			<div v-if="innerValue.length === 0" class="no-rules">
				{{ t('interfaces.filter.no_rules') }}
			</div>

			<nodes
				v-else
				v-model:filter="innerValue"
				:collection="collection"
				:field="fieldName"
				:depth="1"
				:include-validation="includeValidation"
				@remove-node="removeNode($event)"
				@change="emitValue"
			/>
		</v-list>

		<div v-if="fieldName" class="buttons">
			<button @click="addNode(fieldName!)">{{ t('interfaces.filter.add_filter') }}</button>
			<button @click="addNode('$group')">{{ t('interfaces.filter.add_group') }}</button>
		</div>
		<div v-else class="buttons">
			<v-menu placement="bottom-start" show-arrow>
				<template #activator="{ toggle, active }">
					<button class="add-filter" :class="{ active }" @click="toggle">
						<v-icon v-if="inline" name="add" class="add" small />
						<span>{{ t('interfaces.filter.add_filter') }}</span>
						<v-icon name="expand_more" class="expand_more" />
					</button>
				</template>

				<v-field-list :collection="collection" include-functions @select-field="addNode($event)">
					<template #prepend>
						<v-list-item clickable @click="addNode('$group')">
							<v-list-item-content>
								<v-text-overflow :text="t('interfaces.filter.add_group')" />
							</v-list-item-content>
						</v-list-item>
						<v-divider />
					</template>
				</v-field-list>
			</v-menu>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { useFieldsStore } from '@/stores';
import { Filter, Type, FieldFunction } from '@directus/shared/types';
import { getFilterOperatorsForType, getOutputTypeForFunction } from '@directus/shared/utils';
import { cloneDeep, get, isEmpty, set } from 'lodash';
import { computed, inject, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Nodes from './nodes.vue';
import { getNodeName } from './utils';

interface Props {
	value?: Record<string, any>;
	disabled?: boolean;
	collectionName?: string;
	collectionField?: string;
	fieldName?: string;
	inline?: boolean;
	includeValidation?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	value: undefined,
	disabled: false,
	collectionName: undefined,
	collectionField: undefined,
	fieldName: undefined,
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
		let type: Type;
		const field = fieldsStore.getField(collection.value, key);

		if (key.includes('(') && key.includes(')')) {
			const functionName = key.split('(')[0] as FieldFunction;
			type = getOutputTypeForFunction(functionName);
		} else {
			type = field?.type || 'unknown';
		}
		let filterOperators = getFilterOperatorsForType(type);
		const operator = field?.meta?.options?.choices && filterOperators.includes('eq') ? 'eq' : filterOperators[0];
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

	list = list.filter((_node, index) => index !== Number(id));

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
		color: var(--primary);
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
			display: flex;
			align-items: center;
			width: 100%;
			height: 30px;
			padding: 0;
			color: var(--foreground-subdued);
			background-color: var(--background-page);
			border: var(--border-width) solid var(--border-subdued);
			border-radius: 100px;
			transition: border-color var(--fast) var(--transition);
			&:hover,
			&.active {
				border-color: var(--border-normal);
			}
			&.active {
				.expand_more {
					transform: scaleY(-1);
					transition-timing-function: var(--transition-in);
				}
			}
			.add {
				margin-left: 6px;
				margin-right: 4px;
			}
			.expand_more {
				margin-left: auto;
				margin-right: 6px;
				transition: transform var(--medium) var(--transition-out);
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
