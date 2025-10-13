<script setup lang="ts">
import { inject } from 'vue';
import { useI18n } from 'vue-i18n';
import TriggerFlow from './trigger-flow.vue';

const { t } = useI18n();

const { manualFlows } = inject('provide-use-flows') as any;
</script>

<template>
	<sidebar-detail v-if="manualFlows.length > 0" icon="bolt" :title="t('flows')">
		<div class="fields">
			<div v-for="manualFlow in manualFlows" :key="manualFlow.id" class="field full">
				<trigger-flow :flow-id="manualFlow.id" />
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
}
</style>
