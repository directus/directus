<template>
	<v-drawer
		:model-value="open"
		:title="'Change the Trigger'"
		:subtitle="t('panel_options')"
		icon="offline_bolt"
		persistent
		@cancel="$emit('update:open', false)"
	>
		<template #actions>
			<v-button v-tooltip.bottom="t('done')" icon rounded @click="saveTrigger">
				<v-icon name="check" />
			</v-button>
		</template>

		<div class="content">
			<v-fancy-select v-model="flowEdits.trigger" class="select" :items="triggers" />

			<v-form
				v-if="flowEdits.trigger"
				v-model="flowEdits.options"
				class="extension-options"
				:fields="currentTrigger?.options"
				primary-key="+"
			/>
		</div>
	</v-drawer>
</template>

<script setup lang="ts">
import { DeepPartial, Field, FlowRaw, TriggerType } from '@directus/shared/types';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { getTriggers } from '../triggers';

const { t } = useI18n();

const props = defineProps<{
	open: boolean;
	flow?: FlowRaw;
}>();
const emit = defineEmits(['update:open', 'update:flow']);

const flowEdits = ref<{
	trigger?: TriggerType;
	options?: Record<string, any>;
}>({
	trigger: props.flow?.trigger ?? undefined,
	options: props.flow?.options,
});

function saveTrigger() {
	emit('update:flow', {
		...(props.flow ?? {}),
		...flowEdits.value,
	});
	emit('update:open', false);
}

const { triggers } = getTriggers();

const currentTrigger = computed(() => triggers.value.find((trigger) => trigger.value === flowEdits.value.trigger));
</script>

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
