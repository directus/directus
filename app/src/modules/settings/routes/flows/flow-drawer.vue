<template>
	<v-drawer
		:title="isNew ? t('creating_new_flow') : t('updating_flow')"
		class="new-flow"
		persistent
		:model-value="active"
		:sidebar-label="t(currentTab[0])"
		@cancel="$emit('cancel')"
		@esc="$emit('cancel')"
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
							<v-icon v-tooltip="t('required')" class="required" name="star" sup filled />
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
						<div class="type-label">{{ t('description') }}</div>
						<v-input v-model="values.description" :placeholder="t('description')" />
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
					<div class="field full">
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
				v-tooltip.bottom="isNew ? t('next') : t('save')"
				:disabled="!values.name || values.name.length === 0"
				:loading="saving"
				icon
				rounded
				@click="isNew ? (currentTab = ['trigger_setup']) : save()"
			>
				<v-icon :name="isNew ? 'arrow_forward' : 'check'" />
			</v-button>
			<v-button
				v-if="currentTab[0] === 'trigger_setup'"
				v-tooltip.bottom="isNew ? t('finish_setup') : t('save')"
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

<script setup lang="ts">
import api from '@/api';
import { useFlowsStore } from '@/stores/flows';
import { unexpectedError } from '@/utils/unexpected-error';
import { TriggerType } from '@directus/types';
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { getTriggers } from './triggers';

interface Values {
	name: string | null;
	icon: string | null;
	color: string | null;
	description: string | null;
	status: string;
	accountability: string | null;
	trigger?: TriggerType | null;
	options: Record<string, any>;
}

interface Props {
	primaryKey?: string;
	active: boolean;
	startTab?: string;
}

const props = withDefaults(defineProps<Props>(), { primaryKey: '+', startTab: 'flow_setup' });

const emit = defineEmits(['cancel', 'done']);

const { t } = useI18n();

const flowsStore = useFlowsStore();

const currentTab = ref(['flow_setup']);

const isNew = computed(() => props.primaryKey === '+');

const values: Values = reactive({
	name: null,
	icon: 'bolt',
	color: null,
	description: null,
	status: 'active',
	accountability: 'all',
	trigger: undefined,
	options: {},
});

watch(
	() => props.primaryKey,
	(newKey) => {
		currentTab.value = [props.startTab];

		if (newKey === '+') {
			values.name = null;
			values.icon = 'bolt';
			values.color = null;
			values.description = null;
			values.status = 'active';
			values.accountability = 'all';
			values.trigger = undefined;
			values.options = {};
		} else {
			const existing = flowsStore.flows.find((existingFlow) => existingFlow.id === newKey)!;

			values.name = existing.name;
			values.icon = existing.icon;
			values.color = existing.color;
			values.description = existing.description;
			values.status = existing.status;
			values.accountability = existing.accountability;
			values.trigger = existing.trigger;
			values.options = existing.options;
		}
	},
	{ immediate: true }
);

watch(
	() => values.trigger,
	(_, previousTrigger) => {
		if (previousTrigger === undefined) return;

		values.options = {};
	}
);

watch(
	() => values.options?.type,
	(type, previousType) => {
		if (previousType === undefined) return;

		values.options = {
			type,
		};
	}
);

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
		let id: string;

		if (isNew.value) {
			id = await api.post('/flows', values, { params: { fields: ['id'] } }).then((res) => res.data.data.id);
		} else {
			id = await api
				.patch(`/flows/${props.primaryKey}`, values, { params: { fields: ['id'] } })
				.then((res) => res.data.data.id);
		}

		await flowsStore.hydrate();

		emit('done', id);
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
