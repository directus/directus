<script setup lang="ts">
import VDivider from '@/components/v-divider.vue';
import VFieldList from '@/components/v-field-list/v-field-list.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import VNotice from '@/components/v-notice.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { ClientFilterOperator, FieldFunction, Filter, Type } from '@directus/types';
import {
	getFilterOperatorsForType,
	getOutputTypeForFunction,
	parseFilterFunctionPath,
	parseJSON,
} from '@directus/utils';
import { cloneDeep, get, isEmpty, set } from 'lodash';
import { computed, inject, ref } from 'vue';
import Nodes from './nodes.vue';
import { getNodeName } from './utils';

interface Props {
	value?: Record<string, any> | string;
	disabled?: boolean;
	collectionName?: string;
	collectionField?: string;
	collectionRequired?: boolean;

	/**
	 * Lock the interface to only allow configuring filters for the given fieldName
	 */
	fieldName?: string;

	inline?: boolean;
	includeValidation?: boolean;
	includeRelations?: boolean;
	injectVersionField?: boolean;
	relationalFieldSelectable?: boolean;
	rawFieldNames?: boolean;
	rawEditorEnabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	value: undefined,
	disabled: false,
	collectionName: undefined,
	collectionField: undefined,
	collectionRequired: true,
	fieldName: undefined,
	inline: false,
	includeValidation: false,
	includeRelations: true,
	injectVersionField: false,
	relationalFieldSelectable: true,
	rawFieldNames: false,
});

const emit = defineEmits(['input']);

const menuEl = ref();

const values = inject('values', ref<Record<string, any>>({}));

const collection = computed(() => {
	if (props.collectionName) return props.collectionName;
	return values.value[props.collectionField!] ?? null;
});

const fieldsStore = useFieldsStore();
const relationsStore = useRelationsStore();

const innerValue = computed<Filter[]>({
	get() {
		const filterValue = typeof props.value === 'string' ? parseJSON(props.value) : props.value;

		if (!filterValue || isEmpty(filterValue)) return [];

		const name = getNodeName(filterValue);

		if (name === '_and') {
			return cloneDeep(filterValue['_and']);
		} else {
			return cloneDeep([filterValue]);
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
		const isVersion = key === '$version';

		if (isVersion) {
			type = 'string';
		} else if (key.includes('(') && key.includes(')')) {
			const functionName = key.split('(')[0] as FieldFunction;
			type = getOutputTypeForFunction(functionName);
			key = parseFilterFunctionPath(key);
		} else {
			type = field?.type || 'unknown';

			// Alias uses the foreign key type
			if (type === 'alias') {
				const relations = relationsStore.getRelationsForField(collection.value, key);

				if (relations[0]) {
					type = fieldsStore.getField(relations[0].collection, relations[0].field)?.type || 'unknown';
				}
			}
		}

		const filterOperators = getFilterOperatorsForType(type, { includeValidation: props.includeValidation });

		const operator =
			isVersion || (field?.meta?.options?.choices && filterOperators.includes('eq')) ? 'eq' : filterOperators[0];

		const booleanOperators: ClientFilterOperator[] = ['empty', 'nempty', 'null', 'nnull'];
		const initialValue = operator && booleanOperators.includes(operator) ? true : null;

		const node = set({}, key, { ['_' + operator]: initialValue });
		innerValue.value = innerValue.value.concat(node);
	}
}

function removeNode(ids: string[]) {
	const id = ids.pop();

	if (ids.length === 0) {
		innerValue.value = innerValue.value.filter((_node, index) => index !== Number(id));
		return;
	}

	let list = get(innerValue.value, ids.join('.')) as Filter[];

	list = list.filter((_node, index) => index !== Number(id));

	innerValue.value = set(innerValue.value, ids.join('.'), list);
}

// For adding any new fields (eg. flow Validate operation rule)
const newKey = ref<string | null>(null);

function addKeyAsNode() {
	if (!newKey.value) return;
	if (menuEl.value) menuEl.value.deactivate();
	addNode(newKey.value);
	newKey.value = null;
}
</script>

<template>
	<VNotice v-if="collectionRequired && !collectionField && !collection" type="warning">
		{{ $t('collection_field_not_setup') }}
	</VNotice>
	<VNotice v-else-if="collectionRequired && !collection" type="warning">
		{{ $t('select_a_collection') }}
	</VNotice>

	<div v-else class="system-filter" :class="{ inline, empty: innerValue.length === 0, field: fieldName !== undefined }">
		<VList mandatory>
			<div v-if="innerValue.length === 0" class="no-rules">
				{{ $t('interfaces.filter.no_rules') }}
			</div>

			<Nodes
				v-else
				v-model:filter="innerValue"
				:collection="collection"
				:field="fieldName"
				:depth="1"
				:include-validation="includeValidation"
				:include-relations="includeRelations"
				:relational-field-selectable="relationalFieldSelectable"
				:raw-field-names="rawFieldNames"
				:variable-input-enabled="rawEditorEnabled"
				@remove-node="removeNode($event)"
				@change="emitValue"
			/>
		</VList>

		<div v-if="fieldName" class="buttons">
			<button @click="addNode(fieldName!)">{{ $t('interfaces.filter.add_filter') }}</button>
			<button @click="addNode('$group')">{{ $t('interfaces.filter.add_group') }}</button>
		</div>
		<div v-else class="buttons">
			<VMenu ref="menuEl" placement="bottom-start" show-arrow>
				<template #activator="{ toggle, active }">
					<button class="add-filter" :class="{ active }" @click="toggle">
						<VIcon v-if="inline" name="add" class="add" small />
						<span>{{ $t('interfaces.filter.add_filter') }}</span>
						<VIcon name="expand_more" class="expand_more" />
					</button>
				</template>
				<VFieldList
					v-if="collectionRequired"
					:collection="collection"
					include-functions
					:include-relations="includeRelations"
					:relational-field-selectable="relationalFieldSelectable"
					:inject-version-field="injectVersionField"
					:allow-select-all="false"
					:raw-field-names="rawFieldNames"
					@add="addNode($event[0])"
				>
					<template #prepend>
						<VListItem clickable @click="addNode('$group')">
							<VListItemContent>
								<VTextOverflow :text="$t('interfaces.filter.add_group')" />
							</VListItemContent>
						</VListItem>
						<VDivider />
					</template>
				</VFieldList>

				<VList v-else :mandatory="false">
					<VListItem clickable @click="addNode('$group')">
						<VListItemContent>
							<VTextOverflow :text="$t('interfaces.filter.add_group')" />
						</VListItemContent>
					</VListItem>
					<VDivider />
					<VListItem @click.stop>
						<VListItemContent>
							<input
								v-model="newKey"
								class="new-key-input"
								:placeholder="$t('interfaces.filter.add_key_placeholder')"
								@keydown.enter="addKeyAsNode"
							/>
						</VListItemContent>
					</VListItem>
				</VList>
			</VMenu>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.system-filter {
	:deep(ul),
	:deep(li) {
		list-style: none;
	}

	:deep(.group) {
		margin-inline-start: 18px;
		padding-inline-start: 10px;
		border-inline-start: var(--theme--border-width) solid var(--theme--border-color-subdued);
	}

	.v-list {
		min-inline-size: auto;
		margin: 0 0 10px;
		padding: 20px 20px 12px;
		border: var(--theme--border-width) solid var(--theme--border-color-subdued);
		background: var(--theme--form--field--input--background);

		& > :deep(.group) {
			margin-inline-start: 0;
			padding-inline-start: 0;
			border-inline-start: none;
		}
	}

	.buttons {
		padding: 0 10px;
		font-weight: 600;

		span {
			white-space: nowrap;
		}
	}

	&.empty {
		.v-list {
			display: flex;
			align-items: center;
			block-size: var(--theme--form--field--input--height);
			padding-block: 0;
		}

		.no-rules {
			color: var(--theme--form--field--input--foreground-subdued);
			font-family: var(--theme--fonts--monospace--font-family);
		}
	}

	.add-filter {
		color: var(--theme--primary);
	}

	&.inline {
		.v-list {
			margin: 0;
			padding: 0;
			border: 0;
			background: transparent;
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
			inline-size: 100%;
			block-size: 30px;
			padding: 0;
			color: var(--theme--form--field--input--foreground-subdued);
			background-color: var(--theme--form--field--input--background);
			border: var(--theme--border-width) solid var(--theme--border-color-subdued);
			border-radius: 100px;
			transition: border-color var(--fast) var(--transition);
			&:hover,
			&.active {
				border-color: var(--theme--form--field--input--border-color);
			}
			&.active {
				.expand_more {
					transform: scaleY(-1);
					transition-timing-function: var(--transition-in);
				}
			}
			.add {
				margin-inline: 6px 4px;
			}
			.expand_more {
				margin-inline: auto 6px;
				transition: transform var(--medium) var(--transition-out);
			}
		}
	}
}

.field .buttons {
	button {
		color: var(--theme--primary);
		display: inline-block;
		cursor: pointer;
	}

	button + button {
		margin-inline-start: 24px;
	}
}

.new-key-input {
	margin: 0;
	padding: 0;
	line-height: 1.2;
	background-color: transparent;
	border: none;
	border-radius: 0;

	&::placeholder {
		color: var(--v-input-placeholder-color);
	}
}
</style>
