<script setup lang="ts">
import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';
import { ref, reactive, watch } from 'vue';
import { FlowRaw } from '@directus/types';
import { useI18n } from 'vue-i18n';
import { isEqual } from 'lodash';
import { useFlowsStore } from '@/stores/flows';

const props = withDefaults(
	defineProps<{
		modelValue?: boolean;
		flow?: FlowRaw;
	}>(),
	{
		modelValue: false,
		flow: undefined,
	}
);

const emit = defineEmits(['update:modelValue']);

const { t } = useI18n();

const flowsStore = useFlowsStore();

const values = reactive({
	name: props.flow?.name ?? null,
	icon: props.flow?.icon ?? 'bolt',
	color: props.flow?.color ?? null,
	description: props.flow?.description ?? null,
});

watch(
	() => props.modelValue,
	(newValue, oldValue) => {
		if (isEqual(newValue, oldValue) === false) {
			values.name = props.flow?.name ?? null;
			values.icon = props.flow?.icon ?? 'bolt';
			values.color = props.flow?.color ?? null;
			values.description = props.flow?.description ?? null;
		}
	}
);

const saving = ref(false);

function cancel() {
	emit('update:modelValue', false);
}

async function save() {
	saving.value = true;

	try {
		await api.patch(`/flows/${props.flow.id}`, values, { params: { fields: ['id'] } });
		await flowsStore.hydrate();

		emit('update:modelValue', false);
	} catch (err: any) {
		unexpectedError(err);
	} finally {
		saving.value = false;
	}
}
</script>

<template>
	<v-dialog :model-value="modelValue" persistent @update:model-value="$emit('update:modelValue', $event)" @esc="cancel">
		<template #activator="slotBinding">
			<slot name="activator" v-bind="slotBinding" />
		</template>

		<v-card>
			<v-card-title>{{ t('edit_flow') }}</v-card-title>

			<v-card-text>
				<div class="fields">
					<v-input v-model="values.name" class="full" autofocus :placeholder="t('flow_name')" />
					<interface-select-icon :value="values.icon" @input="values.icon = $event" />
					<interface-select-color width="half" :value="values.color" @input="values.color = $event" />
					<v-input v-model="values.description" class="full" />
				</div>
			</v-card-text>

			<v-card-actions>
				<v-button secondary @click="cancel">
					{{ t('cancel') }}
				</v-button>
				<v-button :disabled="!values.name" :loading="saving" @click="save">
					{{ t('save') }}
				</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<style scoped>
.fields {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 12px;
}

.full {
	grid-column: 1 / span 2;
}
</style>
