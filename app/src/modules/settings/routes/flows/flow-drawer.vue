<script setup lang="ts">
import type { TriggerType } from '@directus/types';
import { computed, reactive, ref, watch } from 'vue';
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
import InterfaceSelectColor from '@/interfaces/select-color/select-color.vue';
import InterfaceSelectIcon from '@/interfaces/select-icon/select-icon.vue';
import { useFlowsStore } from '@/stores/flows';
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
	}>(),
	{ primaryKey: '+', startTab: 'flow_setup' },
);

const emit = defineEmits(['cancel', 'done']);

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
			values.options = existing.options ?? {};
		}
	},
	{ immediate: true },
);

watch(
	() => values.trigger,
	(_, previousTrigger) => {
		if (previousTrigger === undefined) return;

		values.options = {};
	},
);

watch(
	() => values.options?.type,
	(type, previousType) => {
		if (previousType === undefined) return;

		values.options = {
			type,
		};
	},
);

const { triggers } = getTriggers();

const currentTrigger = computed(() => triggers.find((trigger) => trigger.id === values.trigger));

const isFlowSetupDisabled = computed(() => !values.name || values.name.length === 0);
const isFlowTriggerDisabled = computed(() => !values.trigger);

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
						<VInput v-model="values.name" autofocus :placeholder="$t('flow_name')" />
					</div>
					<div class="field half">
						<div class="type-label">{{ $t('status') }}</div>
						<VSelect
							v-model="values.status"
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
						/>
					</div>
					<div class="field full">
						<div class="type-label">{{ $t('description') }}</div>
						<VInput v-model="values.description" :placeholder="$t('description')" />
					</div>
					<div class="field half">
						<div class="type-label">{{ $t('icon') }}</div>
						<InterfaceSelectIcon :value="values.icon" @input="values.icon = $event" />
					</div>
					<div class="field half">
						<div class="type-label">{{ $t('color') }}</div>
						<InterfaceSelectColor width="half" :value="values.color" @input="values.color = $event" />
					</div>
					<VDivider class="full" />
					<div class="field full">
						<div class="type-label">{{ $t('flow_tracking') }}</div>
						<VSelect
							v-model="values.accountability"
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
						/>
					</div>
				</div>
			</VTabItem>
			<VTabItem value="trigger_setup">
				<VFancySelect v-model="values.trigger" class="select" :items="triggers" item-text="name" item-value="id" />

				<VForm
					v-if="values.trigger"
					v-model="values.options"
					class="extension-options"
					:fields="currentTriggerOptionFields"
					primary-key="+"
				/>
			</VTabItem>
		</VTabsItems>

		<template #actions>
			<PrivateViewHeaderBarActionButton
				v-if="currentTab[0] === 'flow_setup'"
				v-tooltip.bottom="isNew ? $t('next') : $t('save')"
				:disabled="isFlowSetupDisabled"
				:loading="saving"
				:icon="isNew ? 'arrow_forward' : 'check'"
				@click="onApplyFlowSetup"
			/>

			<PrivateViewHeaderBarActionButton
				v-if="currentTab[0] === 'trigger_setup'"
				v-tooltip.bottom="isNew ? $t('finish_setup') : $t('save')"
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
	margin-block-end: 32px;
}
</style>
