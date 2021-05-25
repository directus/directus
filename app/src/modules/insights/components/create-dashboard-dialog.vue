<template>
	<v-dialog :active="active" @toggle="$listeners.toggle" persistent @esc="cancel">
		<template #activator="slotBinding">
			<slot name="activator" v-bind="slotBinding" />
		</template>

		<v-card>
			<v-card-title>{{ $t('create_dashboard') }}</v-card-title>

			<v-card-text>
				<div class="fields">
					<v-input @keyup.enter="save" autofocus v-model="dashboardName" :placeholder="$t('dashboard_name')" />
					<interface-select-icon v-model="dashboardIcon" />
				</div>
			</v-card-text>

			<v-card-actions>
				<v-button @click="cancel" secondary>
					{{ $t('cancel') }}
				</v-button>
				<v-button :disabled="dashboardName === null || dashboardName.length === 0" @click="save" :loading="saving">
					{{ $t('save') }}
				</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script lang="ts">
import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';
import { defineComponent, ref } from '@vue/composition-api';
import { useInsightsStore } from '@/stores';
import router from '@/router';

export default defineComponent({
	model: {
		prop: 'active',
		event: 'toggle',
	},
	props: {
		active: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const insightsStore = useInsightsStore();

		const dashboardName = ref(null);
		const dashboardIcon = ref(null);
		const saving = ref(false);

		return { dashboardName, cancel, saving, save, dashboardIcon };

		function cancel() {
			dashboardName.value = null;
			emit('toggle', false);
		}

		async function save() {
			saving.value = true;

			try {
				const response = await api.post(
					'/dashboards',
					{ name: dashboardName.value, icon: dashboardIcon.value },
					{ params: { fields: ['id'] } }
				);
				await insightsStore.hydrate();
				router.push(`/insights/${response.data.data.id}`);
				emit('toggle', false);
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
</style>
