<template>
	<div>
		<v-drawer
			v-model="internalActive"
			:title="title"
			icon="change_history"
			:sidebar-label="t(currentTab[0])"
			@cancel="internalActive = false"
		>
			<template #subtitle>
				<revisions-drawer-picker v-model:current="internalCurrent" :revisions="revisions" />
			</template>

			<template #sidebar>
				<v-tabs v-model="currentTab" vertical>
					<v-tab v-for="tab in tabs" :key="tab.value" :value="tab.value">
						{{ tab.text }}
					</v-tab>
				</v-tabs>
			</template>

			<div class="content">
				<revisions-drawer-updates
					v-if="currentTab[0] === 'updates_made'"
					:revision="currentRevision"
					:revisions="revisions"
				/>
				<revisions-drawer-preview v-if="currentTab[0] === 'revision_preview'" :revision="currentRevision" />
			</div>

			<template #actions>
				<v-button v-if="hasPastRevision" v-tooltip.bottom="t('revert')" secondary icon rounded @click="revert">
					<v-icon name="restore" />
				</v-button>
				<v-button v-tooltip.bottom="t('done')" icon rounded @click="internalActive = false">
					<v-icon name="check" />
				</v-button>
			</template>
		</v-drawer>
	</div>
</template>

<script setup lang="ts">
import { Revision } from '@/types/revisions';
import { useSync } from '@directus/composables';
import { isEqual } from 'lodash';
import { computed, ref, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';
import RevisionsDrawerPicker from './revisions-drawer-picker.vue';
import RevisionsDrawerPreview from './revisions-drawer-preview.vue';
import RevisionsDrawerUpdates from './revisions-drawer-updates.vue';

const props = defineProps<{
	revisions: Revision[];
	current: number | null;
	active: boolean;
}>();

const emit = defineEmits<{
	(e: 'revert', value: Record<string, unknown>): void;
	(e: 'update:active', value: boolean): void;
	(e: 'update:current', value: number | string): void;
}>();

const { t } = useI18n();

const internalActive = useSync(props, 'active', emit);
const internalCurrent = useSync(props, 'current', emit);

const currentTab = ref(['updates_made']);

const title = computed(() => {
	return currentRevision.value?.activity.action === 'create' ? t('item_creation') : t('item_revision');
});

const currentRevision = computed(() => {
	return props.revisions.find((revision) => revision.id === props.current)!;
});

const previousRevision = computed<Revision | undefined>(() => {
	const currentIndex = props.revisions.findIndex((revision) => revision.id === props.current);

	// This is assuming props.revisions is in chronological order from newest to oldest
	return props.revisions[currentIndex + 1];
});

const tabs = computed(() => {
	return currentRevision.value?.activity.action === 'create'
		? [
				{
					text: t('creation_preview'),
					value: 'revision_preview',
				},
		  ]
		: [
				{
					text: t('updates_made'),
					value: 'updates_made',
				},
				{
					text: t('revision_preview'),
					value: 'revision_preview',
				},
		  ];
});

const hasPastRevision = computed(() => {
	return currentRevision.value?.activity.action !== 'create';
});

watchEffect(() => (currentTab.value = [tabs.value[0].value]));

function revert() {
	if (!currentRevision.value) return;

	const revertToValues: Record<string, any> = {};

	for (const [field, newValue] of Object.entries(currentRevision.value.delta)) {
		const previousValue = previousRevision.value?.data[field] ?? null;
		if (isEqual(newValue, previousValue)) continue;
		revertToValues[field] = previousValue;
	}

	emit('revert', revertToValues);

	internalActive.value = false;
}
</script>

<style lang="scss" scoped>
.content {
	padding: var(--content-padding);
	padding-top: 0;
	padding-bottom: var(--content-padding);
}
</style>
