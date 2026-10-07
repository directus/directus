<script setup lang="ts">
import type { TriggerType } from '@directus/types';
import { computed, ref, watch } from 'vue';
import { getTriggers } from './triggers';
import api from '@/api';
import VDivider from '@/components/v-divider.vue';
import VDrawer from '@/components/v-drawer.vue';
import VFancySelect from '@/components/v-fancy-select.vue';
import VForm from '@/components/v-form/v-form.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VSelect from '@/components/v-select/v-select.vue';
import VTabItem from '@/components/v-tab-item.vue';
import VTab from '@/components/v-tab.vue';
import VTabsItems from '@/components/v-tabs-items.vue';
import VTabs from '@/components/v-tabs.vue';
import InterfaceInputTranslatedString from '@/interfaces/_system/system-input-translated-string/input-translated-string.vue';
import InterfaceSelectColor from '@/interfaces/select-color/select-color.vue';
import InterfaceSelectIcon from '@/interfaces/select-icon/select-icon.vue';
import { useFlowsStore } from '@/stores/flows';
import { useLicenseStore } from '@/stores/license';
import { unexpectedError } from '@/utils/unexpected-error';
import { PrivateViewHeaderBarActionButton } from '@/views/private';

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

const props = withDefaults(
	defineProps<{
		primaryKey?: string;
		active: boolean;
		startTab?: string;
		folder?: string;
	}>(),
	{ primaryKey: '+', startTab: 'flow_setup' },
);

const emit = defineEmits(['cancel', 'done']);

const flowsStore = useFlowsStore();
const licenseStore = useLicenseStore();

const currentTab = ref(['flow_setup']);

const isNew = computed(() => props.primaryKey === '+');

const edits = ref<Partial<Values>>({});

const initialValues = computed<Values>(() => {
	const existing = isNew.value ? undefined : flowsStore.flows.find((flow) => flow.id === props.primaryKey);

	if (!existing) {
		return {
			name: null,
			icon: 'bolt',
			color: null,
			description: null,
			status: 'active',
			accountability: 'all',
			trigger: undefined,
			options: {},
		};
	}

	return {
		name: existing.name,
		icon: existing.icon,
		color: existing.color,
		description: existing.description,
		status: existing.status,
		accountability: existing.accountability,
		trigger: existing.trigger,
		options: existing.options ?? {},
	};
});

const values = computed<Values>(() => ({ ...initialValues.value, ...edits.value }));

watch(
	() => props.primaryKey,
	() => {
		currentTab.value = [props.startTab];
		edits.value = {};
	},
	{ immediate: true },
);

function updateValue<K extends keyof Values>(field: K, value: Values[K]) {
	const changes: Partial<Values> = { [field]: value };

	// Changing the trigger resets its options
	if (field === 'trigger' && values.value.trigger !== undefined) {
		changes.options = {};
	}

	// Changing the options type resets the rest of the options
	if (field === 'options') {
		const type = (value as Values['options'])?.type;
		const previousType = values.value.options?.type;

		if (previousType !== undefined && type !== previousType) {
			changes.options = { type };
		}
	}

	edits.value = { ...edits.value, ...changes };
}

const { triggers } = getTriggers();

const currentTrigger = computed(() => triggers.find((trigger) => trigger.id === values.value.trigger));

const isFlowSetupDisabled = computed(() => !values.value.name || values.value.name.length === 0);
const isFlowTriggerDisabled = computed(() => !values.value.trigger);

const currentTriggerOptionFields = computed(() => {
	if (!currentTrigger.value) return [];

	if (typeof currentTrigger.value.options === 'function') {
		return currentTrigger.value.options(values.value.options);
	}

	return currentTrigger.value.options;
});

const saving = ref(false);

async function save() {
	saving.value = true;

	try {
		let id: string;

		if (isNew.value) {
			id = await api
				.post('/flows', { ...values.value, folder: props.folder ?? null }, { params: { fields: ['id'] } })
				.then((res) => res.data.data.id);
		} else {
			if (Object.keys(edits.value).length > 0) {
				await api.patch(`/flows/${props.primaryKey}`, edits.value, { params: { fields: ['id'] } });
			}

			id = props.primaryKey;
		}

		await flowsStore.hydrate();
		licenseStore.hydrate();

		emit('done', id);
	} catch (error) {
		unexpectedError(error);
	} finally {
		saving.value = false;
	}
}

function onApplyFlowSetup() {
	if (isFlowSetupDisabled.value || saving.value) return;

	if (!isNew.value) {
		save();
		return;
	}

	currentTab.value = ['trigger_setup'];
}

function onApply() {
	if (saving.value) return;

	if (currentTab.value[0] === 'trigger_setup' && !isFlowTriggerDisabled.value) {
		save();
		return;
	}

	if (currentTab.value[0] !== 'flow_setup') return;

	onApplyFlowSetup();
}
</script>

<template>
	<VDrawer
		:title="isNew ? $t('creating_new_flow') : $t('updating_flow')"
		class="new-flow"
		persistent
		:model-value="active"
		:sidebar-label="$t(currentTab[0] as string)"
		@cancel="$emit('cancel')"
		@apply="onApply"
	>
		<template #sidebar>
			<VTabs v-model="currentTab" vertical>
				<VTab value="flow_setup">{{ $t('flow_setup') }}</VTab>
				<VTab value="trigger_setup" :disabled="!values.name">
					{{ $t('trigger_setup') }}
				</VTab>
			</VTabs>
		</template>

		<VTabsItems v-model="currentTab" class="content">
			<VTabItem value="flow_setup">
				<div class="fields">
					<div class="field half">
						<div class="type-label">
							{{ $t('flow_name') }}
							<VIcon v-tooltip="$t('required')" class="required" name="star" sup filled />
						</div>
						<InterfaceInputTranslatedString
							:value="values.name"
							autofocus
							:placeholder="$t('flow_name')"
							@input="updateValue('name', $event)"
						/>
					</div>
					<div class="field half">
						<div class="type-label">{{ $t('status') }}</div>
						<VSelect
							:model-value="values.status"
							:items="[
								{
									text: $t('active'),
									value: 'active',
								},
								{
									text: $t('inactive'),
									value: 'inactive',
								},
							]"
							@update:model-value="updateValue('status', $event)"
						/>
					</div>
					<div class="field full">
						<div class="type-label">{{ $t('description') }}</div>
						<VInput
							:model-value="values.description"
							:placeholder="$t('description')"
							@update:model-value="updateValue('description', $event)"
						/>
					</div>
					<div class="field half">
						<div class="type-label">{{ $t('icon') }}</div>
						<InterfaceSelectIcon :value="values.icon" @input="updateValue('icon', $event)" />
					</div>
					<div class="field half">
						<div class="type-label">{{ $t('color') }}</div>
						<InterfaceSelectColor width="half" :value="values.color" @input="updateValue('color', $event)" />
					</div>
					<VDivider class="full" />
					<div class="field full">
						<div class="type-label">{{ $t('flow_tracking') }}</div>
						<VSelect
							:model-value="values.accountability"
							:items="[
								{
									text: $t('flow_tracking_all'),
									value: 'all',
								},
								{
									text: $t('flow_tracking_activity'),
									value: 'activity',
								},
								{
									text: $t('flow_tracking_null'),
									value: null,
								},
							]"
							@update:model-value="updateValue('accountability', $event)"
						/>
					</div>
				</div>
			</VTabItem>
			<VTabItem value="trigger_setup">
				<VFancySelect
					:model-value="values.trigger"
					class="select"
					:items="triggers"
					item-text="name"
					item-value="id"
					@update:model-value="updateValue('trigger', $event)"
				/>

				<VForm
					v-if="values.trigger"
					:model-value="values.options"
					class="extension-options"
					:fields="currentTriggerOptionFields"
					primary-key="+"
					@update:model-value="updateValue('options', $event)"
				/>
			</VTabItem>
		</VTabsItems>

		<template #actions:primary>
			<PrivateViewHeaderBarActionButton
				v-if="currentTab[0] === 'flow_setup'"
				:label="isNew ? $t('next') : $t('save')"
				:disabled="isFlowSetupDisabled"
				:loading="saving"
				:icon="isNew ? 'arrow_forward' : 'check'"
				@click="onApplyFlowSetup"
			/>

			<PrivateViewHeaderBarActionButton
				v-if="currentTab[0] === 'trigger_setup'"
				:label="isNew ? $t('finish_setup') : $t('save')"
				:disabled="isFlowTriggerDisabled"
				:loading="saving"
				icon="check"
				@click="save"
			/>
		</template>
	</VDrawer>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.fields {
	@include mixins.form-grid;
}

.v-icon.required {
	color: var(--theme--primary);
}

.content {
	padding: var(--content-padding);
}

.select {
	margin-block-end: 1.8125rem;
}
</style>
