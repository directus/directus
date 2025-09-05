<script setup lang="ts">
import { useRevisions } from '@/composables/use-revisions';
import { useGroupable } from '@directus/composables';
import { ContentVersion } from '@directus/types';
import { abbreviateNumber } from '@directus/utils';
import { computed, onMounted, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import RevisionsDateGroup from './revisions-date-group.vue';
import RevisionsDrawer from './revisions-drawer.vue';
import ComparisonModal from '@/modules/content/components/comparison-modal.vue';
import type { Revision } from '@/types/revisions';

const props = defineProps<{
	collection: string;
	primaryKey: string | number;
	version?: ContentVersion | null;
}>();

defineEmits(['revert']);

const { t } = useI18n();

const title = computed(() => t('revisions'));

const { active: open } = useGroupable({
	value: title.value,
	group: 'sidebar-detail',
});

const { collection, primaryKey, version } = toRefs(props);

const modalActive = ref(false);
const modalCurrentRevision = ref<number | null>(null);
const comparisonModalActive = ref(false);
const comparisonModalCurrentRevision = ref<Revision | null>(null);
const page = ref<number>(1);

const {
	revisions,
	revisionsByDate,
	loading,
	refresh,
	revisionsCount,
	pagesCount,
	created,
	getRevisions,
	loadingCount,
	getRevisionsCount,
} = useRevisions(collection, primaryKey, version, { full: true });

onMounted(() => {
	getRevisionsCount();
	if (open.value) getRevisions();
});

watch(
	() => page.value,
	(newPage) => {
		refresh(newPage);
	},
);

function openModal(id: number) {
	const revision = revisions.value?.find((r) => r.id === id);

	if (revision) {
		comparisonModalCurrentRevision.value = revision as Revision;
		comparisonModalActive.value = true;
	}
}

function onToggle(open: boolean) {
	if (open && revisions.value === null) getRevisions();
}

defineExpose({
	refresh,
});
</script>

<template>
	<sidebar-detail
		:title
		icon="change_history"
		:badge="!loadingCount && revisionsCount > 0 ? abbreviateNumber(revisionsCount) : null"
		@toggle="onToggle"
	>
		<v-progress-linear v-if="!revisions && loading" indeterminate />

		<div v-else-if="revisionsCount === 0" class="empty">
			<div class="content">{{ t('no_revisions') }}</div>
		</div>

		<template v-else>
			<template v-for="group in revisionsByDate" :key="group.date.toString()">
				<revisions-date-group :group="group" @click="openModal" />
			</template>

			<template v-if="page == pagesCount && !created">
				<v-divider v-if="revisionsByDate!.length > 0" />

				<div class="external">
					{{ t('revision_delta_created_externally') }}
				</div>
			</template>
			<v-pagination v-if="pagesCount > 1" v-model="page" :length="pagesCount" :total-visible="3" />
		</template>

		<revisions-drawer
			v-if="revisions"
			v-model:current="modalCurrentRevision"
			v-model:active="modalActive"
			:revisions="revisions"
			@revert="$emit('revert', $event)"
		/>

		<comparison-modal
			:active="comparisonModalActive"
			:current-revision="comparisonModalCurrentRevision"
			:delete-versions-allowed="false"
			@restore="$emit('revert', $event)"
			@cancel="comparisonModalActive = false"
		/>
	</sidebar-detail>
</template>

<style lang="scss" scoped>
.v-progress-linear {
	margin: 24px 0;
}

.v-divider {
	--v-divider-color: var(--theme--background-accent);

	margin-block: 24px 8px;

	&:first-of-type {
		margin-block-start: 0;
	}
}

.empty {
	margin-block: 16px;
	margin-inline-start: 2px;
	color: var(--theme--foreground-subdued);
	font-style: italic;
}

.external {
	margin-inline-start: 20px;
	color: var(--theme--foreground-subdued);
	font-style: italic;
}

.other {
	--v-divider-label-color: var(--theme--foreground-subdued);

	font-style: italic;
}

.v-pagination {
	justify-content: center;
	margin-block-start: 24px;
}
</style>
