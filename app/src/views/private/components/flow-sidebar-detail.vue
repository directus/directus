<script setup lang="ts">
import { useInjectRunManualFlow, type ManualFlow } from '@/composables/use-flows';

defineProps<{
	manualFlows: ManualFlow[];
}>();

const { runManualFlow, runningFlows } = useInjectRunManualFlow();
</script>

<template>
	<sidebar-detail v-if="manualFlows.length > 0" icon="bolt" :title="$t('flows')">
		<div class="fields">
			<div v-for="manualFlow in manualFlows" :key="manualFlow.id" class="field full">
				<v-button
					v-tooltip="manualFlow.tooltip"
					small
					full-width
					:style="{ '--v-button-background-color': manualFlow.color }"
					:loading="runningFlows.includes(manualFlow.id)"
					:disabled="manualFlow.isFlowDisabled"
					@click="runManualFlow(manualFlow.id)"
				>
					<v-icon :name="manualFlow.icon ?? 'bolt'" small left />
					{{ manualFlow.name }}
				</v-button>
			</div>
		</div>
	</sidebar-detail>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';
@use '@/styles/colors';

.fields {
	--theme--form--row-gap: 16px;

	@include mixins.form-grid;

	.v-button {
		--v-button-background-color-disabled: var(--theme--background-accent);
		--v-button-background-color-hover: color-mix(
			in srgb,
			var(--v-button-background-color),
			#{colors.$light-theme-shade} 25%
		);

		.dark & {
			--v-button-background-color-hover: color-mix(
				in srgb,
				var(--v-button-background-color),
				#{colors.$dark-theme-shade} 25%
			);
		}
	}

	.v-icon {
		margin-inline-end: 8px;
	}
}
</style>
