<template>
	<v-drawer
		:model-value="isOpen"
		:title="'Create new Action'"
		:subtitle="t('panel_options')"
		:icon="'insert_chart'"
		persistent
		@cancel="close"
	>
		<template #actions>
			<v-button v-tooltip.bottom="t('done')" icon rounded @click="emitSave">
				<v-icon name="check" />
			</v-button>
		</template>

		<div class="content">
			<div class="grid">
				<div class="field half">
					<div class="type-label">{{ t('name') }}</div>
					<v-input></v-input>
				</div>
				<div class="field half">
					<div class="type-label">{{ t('name') }}</div>
					<v-input></v-input>
				</div>
			</div>

			<v-divider />

			<v-fancy-select v-model="operationId" class="select" :items="displayOperations" />

			<v-notice v-if="operationId && !selectedOperation" class="not-found" type="danger">
				{{ t('operation_not_found', { operation: operationId }) }}
				<div class="spacer" />
				<button @click="operationId = undefined">{{ t('reset_interface') }}</button>
			</v-notice>

			<extension-options
				v-if="operationId && selectedOperation"
				:extension="operationId"
				type="operation"
			></extension-options>
		</div>
	</v-drawer>
</template>

<script setup lang="ts">
import { useDialogRoute } from '@/composables/use-dialog-route';
import { router } from '@/router';
import { useI18n } from 'vue-i18n';
import ExtensionOptions from '@/modules/settings/routes/data-model/field-detail/shared/extension-options.vue';
import { computed, ref } from 'vue';
import { getOperation, getOperations } from '@/operations';

const props = withDefaults(
	defineProps<{
		primaryKey: string;
		operationKey: string;
	}>(),
	{}
);

const emit = defineEmits(['save']);

const isOpen = useDialogRoute();
const { t } = useI18n();

const operationId = ref<string | undefined>();

const selectedOperation = computed(() => getOperation(operationId.value));

const { operations, operationsRaw } = getOperations();

const displayOperations = computed(() => {
	return operations.value.map((operation) => ({
		value: operation.id,
		icon: operation.icon,
		text: operation.name,
		description: operation.description,
	}));
});

function close() {
	router.push({ path: `/settings/flows/${props.primaryKey}` });
}

function emitSave() {
	emit('save');
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
