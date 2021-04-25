<template>
	<div class="updates">
		<v-notice type="info">
			{{ $t('changes_made') }}
			<br />
			{{ $t('no_relational_data') }}
		</v-notice>

		<div class="change" v-for="change in changes" :key="change.name">
			<div class="type-label">{{ change.name }}</div>
			<revisions-drawer-updates-change deleted :changes="change.changes" />
			<revisions-drawer-updates-change added :changes="change.changes" />
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { Revision } from './types';
import { useFieldsStore } from '@/stores';
import { diffWordsWithSpace, diffJson, diffArrays } from 'diff';
import RevisionsDrawerUpdatesChange from './revisions-drawer-updates-change.vue';
import { isEqual } from 'lodash';

export default defineComponent({
	components: { RevisionsDrawerUpdatesChange },
	props: {
		revision: {
			type: Object as PropType<Revision>,
			required: true,
		},
		revisions: {
			type: Array as PropType<Revision[]>,
			required: true,
		},
	},
	setup(props) {
		const fieldsStore = useFieldsStore();

		const previousRevision = computed(() => {
			const currentIndex = props.revisions.findIndex((revision) => revision.id === props.revision.id);

			// This is assuming props.revisions is in chronological order from newest to oldest
			return props.revisions[currentIndex + 1];
		});

		const changes = computed(() => {
			if (!previousRevision.value) return null;

			const changedFields = Object.keys(props.revision.delta);

			return changedFields
				.map((fieldKey) => {
					const name = fieldsStore.getField(props.revision.collection, fieldKey)?.name;

					if (!name) return null;

					const currentValue = props.revision.delta[fieldKey];
					const previousValue = previousRevision.value.data[fieldKey];

					if (isEqual(currentValue, previousValue)) return null;

					let changes;

					if (typeof previousValue === 'string' && typeof currentValue === 'string' && currentValue.length > 25) {
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

					return { name, changes };
				})
				.filter((change) => change);
		});

		return { changes, previousRevision };
	},
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
	margin-bottom: 4px;
}

.v-notice {
	margin-bottom: 36px;
}
</style>
