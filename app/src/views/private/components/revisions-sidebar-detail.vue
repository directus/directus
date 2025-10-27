<script setup lang="ts">
import { useRevisions } from '@/composables/use-revisions';
import ComparisonModal from '@/modules/content/components/comparison-modal.vue';
import type { ComparisonData } from '@/modules/content/comparison-utils';
import { useComparison } from '@/modules/content/composables/use-comparison';
import type { Revision } from '@/types/revisions';
import { unexpectedError } from '@/utils/unexpected-error';
import { useGroupable } from '@directus/composables';
import { ContentVersion, PrimaryKey } from '@directus/types';
import { abbreviateNumber } from '@directus/utils';
import RevisionsDateGroup from './revisions-date-group.vue';
import { computed, onMounted, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';

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
const selectedRevision = ref<number | undefined>(undefined);
const comparisonData = ref<ComparisonData | null>(null);
const page = ref<number>(1);

const { normalizeComparisonData } = useComparison({ comparisonData, collection, primaryKey });

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

async function openModal(id: number) {
	const revision = revisions.value?.find((r) => r.id === id);

	if (revision) {
		try {
			const normalizedData = await normalizeComparisonData(
				id,
				'revision',
				version.value,
				undefined,
				revisions.value as Revision[],
			);

			selectedRevision.value = revision.id;
			comparisonData.value = normalizedData;
			comparisonModalActive.value = true;
		} catch (error) {
			unexpectedError(error);
		}
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

		<comparison-modal
			v-model:comparison-data="comparisonData"
			:active="comparisonModalActive"
			:delete-versions-allowed="false"
			:collection="collection"
			:primary-key="primaryKey"
			@confirm="$emit('revert', $event)"
			@cancel="
				comparisonModalActive = false;
				comparisonData = null;
			"
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
