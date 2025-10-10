<script setup lang="ts">
import { useFlows } from '@/composables/use-flows';
import { toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import TriggerFlow from './trigger-flow.vue';

const props = withDefaults(
	defineProps<{
		collection: string;
		primaryKey?: string | number;
		selection?: (number | string)[];
		location: 'collection' | 'item';
		hasEdits?: boolean;
	}>(),
	{
		primaryKey: undefined,
		selection: () => [],
		hasEdits: false,
	},
);

const emit = defineEmits(['refresh']);

const { t } = useI18n();

const { collection, primaryKey, selection, location, hasEdits } = toRefs(props);

const { manualFlows } = useFlows({
	collection,
	primaryKey,
	selection,
	location,
	hasEdits,
});

const handleRefresh = () => {
	emit('refresh');
};
</script>

<template>
	<sidebar-detail v-if="manualFlows.length > 0" icon="bolt" :title="t('flows')">
		<div class="fields">
			<div v-for="manualFlow in manualFlows" :key="manualFlow.id" class="field full">
				<trigger-flow
					:flow-id="manualFlow.id"
					:collection="collection"
					:primary-key="primaryKey"
					:selection="selection"
					:location="location"
					:has-edits="hasEdits"
					@refresh="handleRefresh"
				/>
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
