<template>
	<v-dialog :model-value="modelValue" @update:modelValue="$emit('update:modelValue', $event)" persistent @esc="cancel">
		<template #activator="slotBinding">
			<slot name="activator" v-bind="slotBinding" />
		</template>

		<v-card>
			<v-card-title v-if="!dashboard">{{ t('create_dashboard') }}</v-card-title>
			<v-card-title v-else>{{ t('edit_dashboard') }}</v-card-title>

			<v-card-text>
				<div class="fields">
					<v-input autofocus v-model="values.name" :placeholder="t('dashboard_name')" />
					<interface-select-icon @input="values.icon = $event" :value="values.icon" />
					<v-input class="full" v-model="values.note" :placeholder="t('note')" />
				</div>
			</v-card-text>

			<v-card-actions>
				<v-button @click="cancel" secondary>
					{{ t('cancel') }}
				</v-button>
				<v-button :disabled="!values.name" @click="save" :loading="saving">
					{{ t('save') }}
				</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script lang="ts">
import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';
import { defineComponent, ref, reactive, PropType } from 'vue';
import { useInsightsStore } from '@/stores';
import { router } from '@/router';
import { Dashboard } from '@/types';
import { useI18n } from 'vue-i18n';

export default defineComponent({
	name: 'DashboardDialog',
	emits: ['update:modelValue'],
	props: {
		modelValue: {
			type: Boolean,
			default: false,
		},
		dashboard: {
			type: Object as PropType<Dashboard>,
			default: null,
		},
	},
	setup(props, { emit }) {
		const { t } = useI18n();

		const insightsStore = useInsightsStore();

		const values = reactive({
			name: props.dashboard?.name ?? null,
			icon: props.dashboard?.icon ?? null,
			note: props.dashboard?.note ?? null,
		});

		const saving = ref(false);

		return { values, cancel, saving, save, t };

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
			} catch (err) {
				unexpectedError(err);
			} finally {
				saving.value = false;
			}
		}
	},
});
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
