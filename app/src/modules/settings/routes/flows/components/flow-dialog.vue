<template>
	<v-dialog :model-value="modelValue" persistent @update:modelValue="$emit('update:modelValue', $event)" @esc="cancel">
		<template #activator="slotBinding">
			<slot name="activator" v-bind="slotBinding" />
		</template>

		<v-card>
			<v-card-title v-if="!flow">{{ t('create_flow') }}</v-card-title>
			<v-card-title v-else>{{ t('edit_flow') }}</v-card-title>

			<v-card-text>
				<div class="fields">
					<v-input v-model="values.name" autofocus :placeholder="t('flow_name')" />
					<interface-select-icon :value="values.icon" @input="values.icon = $event" />
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

<script lang="ts">
import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';
import { defineComponent, ref, reactive, PropType, watch } from 'vue';
import { router } from '@/router';
import { FlowRaw } from '@directus/shared/types';
import { useI18n } from 'vue-i18n';
import { isEqual } from 'lodash';

export default defineComponent({
	name: 'FlowDialog',
	props: {
		modelValue: {
			type: Boolean,
			default: false,
		},
		flow: {
			type: Object as PropType<FlowRaw>,
			default: null,
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const values = reactive({
			name: props.flow?.name ?? null,
			icon: props.flow?.icon ?? 'account_tree',
			note: props.flow?.note ?? null,
		});

		watch(
			() => props.modelValue,
			(newValue, oldValue) => {
				if (isEqual(newValue, oldValue) === false) {
					values.name = props.flow?.name ?? null;
					values.icon = props.flow?.icon ?? 'account_tree';
					values.note = props.flow?.note ?? null;
				}
			}
		);

		const saving = ref(false);

		return { values, cancel, saving, save, t };

		function cancel() {
			emit('update:modelValue', false);
		}

		async function save() {
			saving.value = true;

			try {
				if (props.flow) {
					await api.patch(`/flows/${props.flow.id}`, values, { params: { fields: ['id'] } });
				} else {
					const response = await api.post('/flows', values, { params: { fields: ['id'] } });
					router.push(`/flows/${response.data.data.id}`);
				}

				emit('update:modelValue', false);
			} catch (err: any) {
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
