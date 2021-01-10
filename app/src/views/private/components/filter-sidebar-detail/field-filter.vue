<template>
	<div class="field-filter">
		<div class="header">
			<div class="name" v-tooltip="filter.field.split('.').join(' → ')">
				<span v-if="filter.field.includes('.')" class="relational-indicator">•</span>
				{{ name }}
			</div>
			<v-menu show-arrow :disabled="disabled">
				<template #activator="{ toggle }">
					<div class="operator" @click="toggle" v-tooltip.top="$t('change_advanced_filter_operator')">
						<span>{{ $t(`operators.${activeOperator}`) }}</span>
						<v-icon name="expand_more" />
					</div>
				</template>

				<v-list>
					<v-list-item
						:active="operator === activeOperator"
						v-for="operator in parsedField.operators"
						:key="operator"
						@click="activeOperator = operator"
					>
						<v-list-item-content>{{ $t(`operators.${operator}`) }}</v-list-item-content>
					</v-list-item>
				</v-list>
			</v-menu>
			<div class="spacer" />
			<v-icon class="remove" name="close" @click="$emit('remove')" v-tooltip.left="$t('delete_advanced_filter')" />
		</div>
		<div class="field">
			<filter-input v-model="value" :type="parsedField.type" :operator="activeOperator" :disabled="disabled" />
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { Filter } from '@/types';
import { useFieldsStore } from '@/stores';
import getAvailableOperatorsForType from './get-available-operators-for-type';
import FilterInput from './filter-input.vue';

export default defineComponent({
	components: { FilterInput },
	props: {
		filter: {
			type: Object as PropType<Filter>,
			required: true,
		},
		collection: {
			type: String,
			required: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const fieldsStore = useFieldsStore();

		const activeOperator = computed({
			get() {
				return props.filter.operator;
			},
			set(newOperator) {
				emit('update', { operator: newOperator });
			},
		});

		const value = computed({
			get() {
				return props.filter.value;
			},
			set(newValue) {
				emit('update', { value: newValue });
			},
		});

		const name = computed<string>(() => {
			return getNameForFieldKey(props.filter.field);
		});

		const parsedField = computed(() => {
			const field = getFieldForKey(props.filter.field);
			return getAvailableOperatorsForType(field.type);
		});

		return { activeOperator, value, name, parsedField };

		function getFieldForKey(fieldKey: string) {
			return fieldsStore.getField(props.collection, fieldKey);
		}

		function getNameForFieldKey(fieldKey: string) {
			return getFieldForKey(fieldKey)?.name;
		}
	},
});
</script>

<style lang="scss" scoped>
.field-filter {
	.header {
		display: flex;
		align-items: center;
		margin-bottom: 4px;
	}

	.name,
	.operator {
		overflow: hidden;
		white-space: nowrap;
	}

	.name {
		position: relative;
		margin-right: 8px;
		overflow: visible;
		text-overflow: ellipsis;

		.relational-indicator {
			position: absolute;
			top: -1px;
			left: -10px;
			color: var(--foreground-subdued);
		}
	}

	.operator {
		display: flex;
		align-items: center;
		color: var(--primary);
		cursor: pointer;

		span {
			flex-grow: 1;
			overflow: hidden;
			white-space: nowrap;
			text-overflow: ellipsis;
		}
	}

	.spacer {
		flex-grow: 1;
	}

	.remove {
		--v-icon-color: var(--foreground-subdued);

		flex-grow: 0;
		flex-shrink: 0;
		opacity: 0;

		&:hover {
			--v-icon-color: var(--danger);
		}
	}

	&:hover {
		.header .remove {
			opacity: 1;
		}
	}
}
</style>
