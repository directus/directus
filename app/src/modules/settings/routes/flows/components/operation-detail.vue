<template>
	<v-drawer
		:model-value="isOpen"
		:title="t(operationId === '+' ? 'create_operation' : 'edit_operation')"
		:subtitle="flow.name"
		icon="offline_bolt"
		persistent
		@cancel="$emit('cancel')"
	>
		<template #actions>
			<v-button v-tooltip.bottom="t('done')" icon rounded :disabled="saveDisabled" @click="saveOperation">
				<v-icon name="check" />
			</v-button>
		</template>

		<div class="content">
			<div class="grid">
				<div class="field half">
					<div class="type-label">
						{{ t('name') }}
					</div>
					<v-input v-model="operationName" autofocus :placeholder="generatedName">
						<template #append>
							<v-icon name="title" />
						</template>
					</v-input>
				</div>
				<div class="field half">
					<div class="type-label">
						{{ t('key') }}
					</div>
					<v-input v-model="operationKey" db-safe :placeholder="generatedKey">
						<template #append>
							<v-icon name="vpn_key" />
						</template>
					</v-input>
					<small v-if="!isOperationKeyUnique" class="error selectable">{{ t('operation_key_unique_error') }}</small>
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
import ExtensionOptions from '@/modules/settings/routes/data-model/field-detail/shared/extension-options.vue';
import { getOperation, getOperations } from '@/operations';
import { translate } from '@/utils/translate-object-values';
import { FlowRaw } from '@directus/shared/types';
import slugify from '@sindresorhus/slugify';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { customAlphabet } from 'nanoid';

const generateSuffix = customAlphabet('abcdefghijklmnopqrstuvwxyz1234567890', 5);

const props = withDefaults(
	defineProps<{
		primaryKey: string;
		operationId: string;
		operation?: Record<string, any>;
		existingOperationKeys?: string[];
		flow: FlowRaw;
	}>(),
	{
		operation: undefined,
		existingOperationKeys: undefined,
	}
);

const emit = defineEmits(['save', 'cancel']);

const isOpen = useDialogRoute();
const { t } = useI18n();

const options = ref<Record<string, any>>(props.operation?.options ?? {});
const operationType = ref<string | undefined>(props.operation?.type);
const operationKey = ref<string | null>(props.operation?.key ?? null);
const operationName = ref<string | null>(props.operation?.name ?? null);
const saving = ref(false);

const isOperationKeyUnique = computed(
	() =>
		saving.value ||
		operationKey.value === null ||
		!(props.operation?.key !== operationKey.value && props.existingOperationKeys?.includes(operationKey.value))
);

const saveDisabled = computed(() => {
	return !operationType.value || !isOperationKeyUnique.value;
});

watch(operationType, () => {
	options.value = {};
});

watch(
	operationName,
	(newName, oldName) => {
		if (
			newName === null ||
			operationKey.value ===
				slugify(oldName ?? '', {
					separator: '_',
				})
		)
			operationKey.value = slugify(newName ?? '', {
				separator: '_',
			});
	},
	{ immediate: true }
);

const selectedOperation = computed(() => getOperation(operationType.value));

const generatedName = computed(() => (selectedOperation.value ? selectedOperation.value?.name : t('operation_name')));

const generatedKey = computed(() =>
	selectedOperation.value ? selectedOperation.value?.id + '_' + generateSuffix() : t('operation_key')
);

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
	} else if (typeof selectedOperation.value?.options === 'object') {
		return selectedOperation.value.options;
	}
	return undefined;
});

function saveOperation() {
	saving.value = true;
	emit('save', {
		flow: props.primaryKey,
		name: operationName.value || generatedName.value,
		key: operationKey.value || generatedKey.value,
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

.required {
	--v-icon-color: var(--primary);

	margin-top: -12px;
	margin-left: -4px;
}

.error {
	display: block;
	margin-top: 4px;
	color: var(--danger);
	font-style: italic;
}
</style>
