<script setup lang="ts">
import VDivider from '@/components/v-divider.vue';
import VPagination from '@/components/v-pagination.vue';
import VProgressLinear from '@/components/v-progress-linear.vue';
import { useRevisions } from '@/composables/use-revisions';
import type { Revision } from '@/types/revisions';
import ComparisonModal from '@/views/private/components/comparison/comparison-modal.vue';
import { useGroupable } from '@directus/composables';
import { ContentVersion, PrimaryKey } from '@directus/types';
import { abbreviateNumber } from '@directus/utils';
import { computed, onMounted, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import RevisionsDateGroup from './revisions-date-group.vue';
import SidebarDetail from './sidebar-detail.vue';

const props = defineProps<{
	collection: string;
	primaryKey: PrimaryKey;
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

const comparisonModalActive = ref(false);
const currentRevision = ref<Revision | null>(null);
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
	currentRevision.value = (revisions.value as Revision[])?.find((revision) => revision.id === id) ?? null;
	comparisonModalActive.value = true;
}

function closeModal() {
	comparisonModalActive.value = false;
	currentRevision.value = null;
}

function onToggle(open: boolean) {
	if (open && revisions.value === null) getRevisions();
}

defineExpose({
	refresh,
});
</script>

<template>
	<SidebarDetail
		id="revisions"
		:title
		icon="change_history"
		:badge="!loadingCount && revisionsCount > 0 ? abbreviateNumber(revisionsCount) : null"
		@toggle="onToggle"
	>
		<VProgressLinear v-if="!revisions && loading" indeterminate />

		<div v-else-if="revisionsCount === 0" class="empty">
			<div class="content">{{ $t('no_revisions') }}</div>
		</div>

		<template v-else>
			<template v-for="group in revisionsByDate" :key="group.date.toString()">
				<RevisionsDateGroup :group="group" @click="openModal" />
			</template>

			<template v-if="page == pagesCount && !created">
				<VDivider v-if="revisionsByDate!.length > 0" />

				<div class="external">
					{{ $t('revision_delta_created_externally') }}
				</div>
			</template>
			<VPagination v-if="pagesCount > 1" v-model="page" :length="pagesCount" :total-visible="3" />
		</template>

		<ComparisonModal
			v-model="comparisonModalActive"
			v-model:current-revision="currentRevision"
			:delete-versions-allowed="false"
			:collection
			:primary-key
			mode="revision"
			:current-version="version"
			:revisions="revisions as Revision[]"
			@confirm="$emit('revert', $event)"
			@cancel="closeModal"
		/>
	</SidebarDetail>
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
