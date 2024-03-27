<script setup lang="ts">
import { FlowRaw, TriggerType } from '@directus/types';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { getTriggers } from '../triggers';

const { t } = useI18n();

const props = defineProps<{
	open: boolean;
	flow?: FlowRaw;
	preview?: boolean;
}>();

const emit = defineEmits(['update:open', 'update:flow', 'first-save']);

const flowEdits = ref<{
	trigger?: TriggerType;
	options: Record<string, any>;
}>({
	trigger: props.flow?.trigger ?? undefined,
	options: props.flow?.options ?? {
		name: '',
	},
});

function saveTrigger() {
	if (!currentTrigger.value) return;

	emit('update:flow', {
		...(props.flow ?? {}),
		...flowEdits.value,
	});

	emit('update:open', false);
}

const { triggers } = getTriggers();

const currentTrigger = computed(() => triggers.find((trigger) => trigger.id === flowEdits.value.trigger));

const currentTriggerOptionFields = computed(() => {
	if (!currentTrigger.value) return [];

	if (typeof currentTrigger.value.options === 'function') {
		return currentTrigger.value.options(flowEdits.value.options);
	}

	return currentTrigger.value.options;
});
</script>

<template>
	<v-drawer
		:model-value="open"
		:title="t('change_trigger')"
		:subtitle="t('trigger_options')"
		icon="offline_bolt"
		persistent
		@cancel="$emit('update:open', false)"
	>
		<template #actions>
			<v-button v-tooltip.bottom="t('done')" icon rounded :disabled="!currentTrigger" @click="saveTrigger">
				<v-icon name="check" />
			</v-button>
		</template>

		<div class="content">
			<v-fancy-select v-model="flowEdits.trigger" class="select" :items="triggers" item-text="name" item-value="id" />

			<v-form
				v-if="flowEdits.trigger"
				v-model="flowEdits.options"
				class="extension-options"
				:fields="currentTriggerOptionFields"
				:initial-values="flow?.options"
				primary-key="+"
			/>
		</div>
	</v-drawer>
</template>

<style scoped lang="scss">
@import '@/styles/mixins/form-grid';

.content {
	padding: var(--content-padding);
	padding-top: 0;
	padding-bottom: var(--content-padding-bottom);

	.grid {
		@include form-grid;
	}
}

.v-divider {
	margin: 52px 0;
}
.type-label {
	margin-bottom: 8px;
}

.type-title,
.select {
	margin-bottom: 32px;
}

.not-found {
	.spacer {
		flex-grow: 1;
	}

	button {
		text-decoration: underline;
	}
}

.v-notice {
	margin-bottom: 36px;
}
</style>
