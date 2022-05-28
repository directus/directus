<template>
	<v-drawer
		:title="t('creating_new_flow')"
		:model-value="isOpen"
		class="new-flow"
		persistent
		:sidebar-label="t(currentTab[0])"
		@cancel="router.push('/settings/flows')"
	>
		<template #sidebar>
			<v-tabs v-model="currentTab" vertical>
				<v-tab value="flow_setup">{{ t('flow_setup') }}</v-tab>
				<v-tab value="trigger_setup" :disabled="!values.name">
					{{ t('trigger_setup') }}
				</v-tab>
			</v-tabs>
		</template>

		<v-tabs-items v-model="currentTab" class="content">
			<v-tab-item value="flow_setup">
				<div class="fields">
					<div class="field half">
						<div class="type-label">
							{{ t('flow_name') }}
							<v-icon v-tooltip="t('required')" class="required" name="star" sup />
						</div>
						<v-input v-model="values.name" autofocus :placeholder="t('flow_name')" />
					</div>
					<div class="field half">
						<div class="type-label">{{ t('status') }}</div>
						<v-select
							v-model="values.status"
							:items="[
								{
									text: t('active'),
									value: 'active',
								},
								{
									text: t('inactive'),
									value: 'inactive',
								},
							]"
						/>
					</div>
					<div class="field full">
						<div class="type-label">{{ t('note') }}</div>
						<v-input v-model="values.note" :placeholder="t('note')" />
					</div>
					<div class="field half">
						<div class="type-label">{{ t('icon') }}</div>
						<interface-select-icon :value="values.icon" @input="values.icon = $event" />
					</div>
					<div class="field half">
						<div class="type-label">{{ t('color') }}</div>
						<interface-select-color width="half" :value="values.color" @input="values.color = $event" />
					</div>
					<v-divider class="full" />
					<div class="field half-left">
						<div class="type-label">{{ t('flow_tracking') }}</div>
						<v-select
							v-model="values.accountability"
							:items="[
								{
									text: t('flow_tracking_all'),
									value: 'all',
								},
								{
									text: t('flow_tracking_activity'),
									value: 'activity',
								},
								{
									text: t('flow_tracking_null'),
									value: null,
								},
							]"
						/>
					</div>
				</div>
			</v-tab-item>
			<v-tab-item value="trigger_setup">
				<v-fancy-select v-model="values.trigger" class="select" :items="triggers" item-text="name" item-value="id" />

				<v-form
					v-if="values.trigger"
					v-model="values.options"
					class="extension-options"
					:fields="currentTriggerOptionFields"
					primary-key="+"
				/>
			</v-tab-item>
		</v-tabs-items>

		<template #actions>
			<v-button
				v-if="currentTab[0] === 'flow_setup'"
				v-tooltip.bottom="t('next')"
				:disabled="!values.name || values.name.length === 0"
				icon
				rounded
				@click="currentTab = ['trigger_setup']"
			>
				<v-icon name="arrow_forward" />
			</v-button>
			<v-button
				v-if="currentTab[0] === 'trigger_setup'"
				v-tooltip.bottom="t('finish_setup')"
				:disabled="!values.trigger"
				:loading="saving"
				icon
				rounded
				@click="save"
			>
				<v-icon name="check" />
			</v-button>
		</template>
	</v-drawer>
</template>

<script lang="ts" setup>
import api from '@/api';
import { useDialogRoute } from '@/composables/use-dialog-route';
import { useFlowsStore } from '@/stores';
import { unexpectedError } from '@/utils/unexpected-error';
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { getTriggers } from './triggers';

interface Values {
	name: string | null;
	icon: string | null;
	color: string | null;
	note: string | null;
	status: string;
	accountability: string | null;
	trigger?: string;
	options: Record<string, any>;
}

const { t } = useI18n();

const router = useRouter();

const flowsStore = useFlowsStore();

const isOpen = useDialogRoute();

const currentTab = ref(['flow_setup']);

const values: Values = reactive({
	name: null,
	icon: 'bolt',
	color: null,
	note: null,
	status: 'active',
	accountability: 'all',
	trigger: undefined,
	options: {},
});

const { triggers } = getTriggers();

const currentTrigger = computed(() => triggers.find((trigger) => trigger.id === values.trigger));

const currentTriggerOptionFields = computed(() => {
	if (!currentTrigger.value) return [];

	if (typeof currentTrigger.value.options === 'function') {
		return currentTrigger.value.options(values.options);
	}

	return currentTrigger.value.options;
});

const saving = ref(false);

async function save() {
	saving.value = true;

	try {
		const response = await api.post('/flows', values, { params: { fields: ['id'] } });
		await flowsStore.hydrate();

		router.push({
			name: 'settings-flows-item',
			params: { primaryKey: response.data.data.id, firstOpen: 'true' },
		});
	} catch (err: any) {
		unexpectedError(err);
	} finally {
		saving.value = false;
	}
}
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.fields {
	@include form-grid;
}

.v-icon.required {
	color: var(--primary);
}

.content {
	padding: var(--content-padding);
	padding-top: 0;
	padding-bottom: var(--content-padding);
}

.select {
	margin-bottom: 32px;
}
</style>
