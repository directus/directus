<template>
	<div class="updates">
		<v-notice type="info">
			{{ t('changes_made') }}
			<br />
			{{ t('no_relational_data') }}
		</v-notice>

		<div v-for="change in changes" :key="change!.name" class="change">
			<div class="type-label">{{ change!.name }}</div>
			<template v-if="change!.updated">
				<revisions-drawer-updates-change updated :changes="change!.changes" />
			</template>
			<template v-else>
				<revisions-drawer-updates-change deleted :changes="change!.changes" />
				<revisions-drawer-updates-change added :changes="change!.changes" />
			</template>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useFieldsStore } from '@/stores/fields';
import { Revision } from '@/types/revisions';
import { diffArrays, diffJson, diffWordsWithSpace } from 'diff';
import { isEqual } from 'lodash';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import RevisionsDrawerUpdatesChange from './revisions-drawer-updates-change.vue';

const props = defineProps<{
	revision: Revision;
	revisions: Revision[];
}>();

const { t } = useI18n();

const fieldsStore = useFieldsStore();

const previousRevision = computed(() => {
	const currentIndex = props.revisions.findIndex((revision) => revision.id === props.revision.id);

	// This is assuming props.revisions is in chronological order from newest to oldest
	return props.revisions[currentIndex + 1];
});

const changes = computed(() => {
	if (!previousRevision.value) return [];

	const changedFields = Object.keys(props.revision.delta);

	return changedFields
		.map((fieldKey) => {
			const field = fieldsStore.getField(props.revision.collection, fieldKey);
			const name = field?.name;

			if (!name) return null;

			const currentValue = props.revision.delta?.[fieldKey];
			const previousValue = previousRevision.value.data?.[fieldKey];

			let changes;
			let updated = false;

			if (isEqual(currentValue, previousValue)) {
				if (field?.meta?.special && field.meta.special.includes('conceal')) {
					updated = true;

					changes = [
						{
							updated: true,
							value: currentValue,
						},
					];
				} else {
					return null;
				}
			} else if (typeof previousValue === 'string' && typeof currentValue === 'string' && currentValue.length > 25) {
				changes = diffWordsWithSpace(previousValue, currentValue);
			} else if (Array.isArray(previousValue) && Array.isArray(currentValue)) {
				changes = diffArrays(previousValue, currentValue);
			} else if (
				previousValue &&
				currentValue &&
				typeof currentValue === 'object' &&
				typeof currentValue === 'object'
			) {
				changes = diffJson(previousValue, currentValue);
			} else {
				// This is considering the whole thing a change
				changes = [
					{
						removed: true,
						value: previousValue,
					},
					{
						added: true,
						value: currentValue,
					},
				];
			}

			return { name, updated, changes };
		})
		.filter((change) => change);
});
</script>

<style lang="scss" scoped>
.change {
	margin-bottom: 24px;
}

.type-label {
	margin-bottom: 8px;
}

.change-line {
	margin-bottom: 0px;
}

.v-notice {
	margin-bottom: 36px;
}
</style>
