<script setup lang="ts">
import api from '@/api';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VInput from '@/components/v-input.vue';
import InterfaceSelectColor from '@/interfaces/select-color/select-color.vue';
import InterfaceSelectIcon from '@/interfaces/select-icon/select-icon.vue';
import { router } from '@/router';
import { useInsightsStore } from '@/stores/insights';
import { Dashboard } from '@/types/insights';
import { unexpectedError } from '@/utils/unexpected-error';
import { isEqual } from 'lodash';
import { computed, reactive, ref, watch } from 'vue';

const props = defineProps<{
	modelValue?: boolean;
	dashboard?: Dashboard;
}>();

const emit = defineEmits<{
	(e: 'update:modelValue', value: boolean): void;
}>();

const insightsStore = useInsightsStore();

const values = reactive({
	name: props.dashboard?.name ?? null,
	icon: props.dashboard?.icon ?? 'dashboard',
	color: props.dashboard?.color ?? null,
	note: props.dashboard?.note ?? null,
});

const isSaveDisabled = computed(() => !values.name);

watch(
	() => props.modelValue,
	(newValue, oldValue) => {
		if (isEqual(newValue, oldValue) === false) {
			values.name = props.dashboard?.name ?? null;
			values.icon = props.dashboard?.icon ?? 'space_dashboard';
			values.color = props.dashboard?.color ?? null;
			values.note = props.dashboard?.note ?? null;
		}
	},
);

const saving = ref(false);

function cancel() {
	emit('update:modelValue', false);
}

async function save() {
	if (isSaveDisabled.value || saving.value) return;

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
	} catch (error) {
		unexpectedError(error);
	} finally {
		saving.value = false;
	}
}
</script>

<template>
	<VDialog
		:model-value="modelValue"
		persistent
		@update:model-value="$emit('update:modelValue', $event)"
		@esc="cancel"
		@apply="save"
	>
		<template #activator="slotBinding">
			<slot name="activator" v-bind="slotBinding" />
		</template>

		<VCard>
			<VCardTitle v-if="!dashboard">{{ $t('create_dashboard') }}</VCardTitle>
			<VCardTitle v-else>{{ $t('edit_dashboard') }}</VCardTitle>

			<VCardText>
				<div class="fields">
					<VInput v-model="values.name" class="full" autofocus :placeholder="$t('dashboard_name')" />
					<InterfaceSelectIcon :value="values.icon" @input="values.icon = $event" />
					<InterfaceSelectColor width="half" :value="values.color" @input="values.color = $event" />
					<VInput v-model="values.note" class="full" :placeholder="$t('note')" />
				</div>
			</VCardText>

			<VCardActions>
				<VButton secondary @click="cancel">
					{{ $t('cancel') }}
				</VButton>
				<VButton :disabled="isSaveDisabled" :loading="saving" @click="save">
					{{ $t('save') }}
				</VButton>
			</VCardActions>
		</VCard>
	</VDialog>
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
