<template>
	<v-dialog :model-value="modelValue" persistent @update:model-value="$emit('update:modelValue', $event)" @esc="cancel">
		<template #activator="slotBinding">
			<slot name="activator" v-bind="slotBinding" />
		</template>

		<v-card>
			<v-card-title v-if="!dashboard">{{ t('create_dashboard') }}</v-card-title>
			<v-card-title v-else>{{ t('edit_dashboard') }}</v-card-title>

			<v-card-text>
				<div class="fields">
					<v-input v-model="values.name" class="full" autofocus :placeholder="t('dashboard_name')" />
					<interface-select-icon :value="values.icon" @input="values.icon = $event" />
					<interface-select-color width="half" :value="values.color" @input="values.color = $event" />
					<v-input v-model="values.note" class="full" :placeholder="t('note')" />
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

<script setup lang="ts">
import api from '@/api';
import { router } from '@/router';
import { useInsightsStore } from '@/stores/insights';
import { Dashboard } from '@/types/insights';
import { unexpectedError } from '@/utils/unexpected-error';
import { isEqual } from 'lodash';
import { reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	modelValue?: boolean;
	dashboard?: Dashboard;
}>();

const emit = defineEmits<{
	(e: 'update:modelValue', value: boolean): void;
}>();

const { t } = useI18n();

const insightsStore = useInsightsStore();

const values = reactive({
	name: props.dashboard?.name ?? null,
	icon: props.dashboard?.icon ?? 'dashboard',
	color: props.dashboard?.color ?? null,
	note: props.dashboard?.note ?? null,
});

watch(
	() => props.modelValue,
	(newValue, oldValue) => {
		if (isEqual(newValue, oldValue) === false) {
			values.name = props.dashboard?.name ?? null;
			values.icon = props.dashboard?.icon ?? 'dashboard';
			values.color = props.dashboard?.color ?? null;
			values.note = props.dashboard?.note ?? null;
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
		if (props.dashboard) {
			await api.patch(`/dashboards/${props.dashboard.id}`, values, { params: { fields: ['id'] } });
			await insightsStore.hydrate();
		} else {
			const response = await api.post('/dashboards', values, { params: { fields: ['id'] } });
			await insightsStore.hydrate();
			router.push(`/insights/${response.data.data.id}`);
		}

		emit('update:modelValue', false);
	} catch (err: any) {
		unexpectedError(err);
	} finally {
		saving.value = false;
	}
}
</script>

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
