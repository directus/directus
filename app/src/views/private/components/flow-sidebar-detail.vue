<script setup lang="ts">
import SidebarDetail from './sidebar-detail.vue';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import { type ManualFlow, useInjectRunManualFlow } from '@/composables/use-flows';

defineProps<{
	manualFlows: ManualFlow[];
}>();

const { runManualFlow, runningFlows } = useInjectRunManualFlow();
</script>

<template>
	<SidebarDetail v-if="manualFlows.length > 0" id="flows" icon="bolt" :title="$t('flows')">
		<div class="fields">
			<div v-for="manualFlow in manualFlows" :key="manualFlow.id" class="field full">
				<VButton
					v-tooltip="manualFlow.tooltip"
					small
					full-width
					:style="{ '--v-button-background-color': manualFlow.color }"
					:loading="runningFlows.includes(manualFlow.id)"
					:disabled="manualFlow.isFlowDisabled"
					@click="runManualFlow(manualFlow.id)"
				>
					<VIcon :name="manualFlow.icon ?? 'bolt'" small left />
					{{ manualFlow.name }}
				</VButton>
			</div>
		</div>
	</SidebarDetail>
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
