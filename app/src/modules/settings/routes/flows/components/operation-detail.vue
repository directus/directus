<template>
	<v-drawer
		:model-value="isOpen"
		:title="t(operationId === '+' ? 'create_operation' : 'edit_operation')"
		:subtitle="t('operation_options')"
		:icon="'insert_chart'"
		persistent
		@cancel="$emit('cancel')"
	>
		<template #actions>
			<v-button v-tooltip.bottom="t('done')" icon rounded :disabled="!operationType" @click="saveOperation">
				<v-icon name="check" />
			</v-button>
		</template>

		<div class="content">
			<div class="grid">
				<div class="field half">
					<div class="type-label">{{ t('name') }}</div>
					<v-input v-model="operationName"></v-input>
				</div>
				<div class="field half">
					<div class="type-label">{{ t('key') }}</div>
					<v-input v-model="operationKey"></v-input>
				</div>
			</div>

			<v-divider />

			<v-fancy-select v-model="operationType" class="select" :items="displayOperations" />

			<v-notice v-if="operationType && !selectedOperation" class="not-found" type="danger">
				{{ t('operation_not_found', { operation: operationType }) }}
				<div class="spacer" />
				<button @click="operationType = undefined">{{ t('reset_interface') }}</button>
			</v-notice>

			<extension-options
				v-if="operationType && selectedOperation && operationOptions"
				v-model="options"
				:extension="operationType"
				:options="operationOptions"
				type="operation"
			></extension-options>
			<component
				:is="`operation-options-${operationType}`"
				v-else-if="operationType && selectedOperation"
				:options="operation"
			/>
		</div>
	</v-drawer>
</template>

<script setup lang="ts">
import { useDialogRoute } from '@/composables/use-dialog-route';
import { useI18n } from 'vue-i18n';
import ExtensionOptions from '@/modules/settings/routes/data-model/field-detail/shared/extension-options.vue';
import { computed, ref, watch } from 'vue';
import { getOperation, getOperations } from '@/operations';
import { translate } from '@/utils/translate-object-values';

const props = withDefaults(
	defineProps<{
		primaryKey: string;
		operationId: string;
		operation?: Record<string, any>;
	}>(),
	{
		operation: undefined,
	}
);

const emit = defineEmits(['save', 'cancel']);

const isOpen = useDialogRoute();
const { t } = useI18n();

const options = ref<Record<string, any>>(props.operation?.options ?? {});
const operationType = ref<string | undefined>(props.operation?.type);
const operationKey = ref<string>(props.operation?.key ?? '');
const operationName = ref(props.operation?.name ?? '');

watch(operationType, () => {
	options.value = {};
});

const selectedOperation = computed(() => getOperation(operationType.value));

const { operations } = getOperations();

const displayOperations = computed(() => {
	return operations.value.map((operation) => ({
		value: operation.id,
		icon: operation.icon,
		text: operation.name,
		description: operation.description,
	}));
});

const operationOptions = computed(() => {
	if (typeof selectedOperation.value?.options === 'function') {
		return translate(selectedOperation.value.options(options.value));
	}
	return undefined;
});

function saveOperation() {
	emit('save', {
		flow: props.primaryKey,
		name: operationName.value,
		key: operationKey.value,
		type: operationType.value,
		options: options.value,
	});
}
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.content {
	padding: var(--content-padding);
	padding-top: 0;
	padding-bottom: var(--content-padding-bottom);

	.grid {
		@include form-grid;
	}
}

.v-divider {
	margin: 52px 0;
}
.type-label {
	margin-bottom: 8px;
}

.type-title,
.select {
	margin-bottom: 32px;
}

.not-found {
	.spacer {
		flex-grow: 1;
	}

	button {
		text-decoration: underline;
	}
}

.v-notice {
	margin-bottom: 36px;
}
</style>
