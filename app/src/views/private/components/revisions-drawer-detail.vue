<script setup lang="ts">
import { useRevisions } from '@/composables/use-revisions';
import { ContentVersion } from '@directus/types';
import { abbreviateNumber } from '@directus/utils';
import { onMounted, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import RevisionsDateGroup from './revisions-date-group.vue';
import RevisionsDrawer from './revisions-drawer.vue';

const props = defineProps<{
	collection: string;
	primaryKey: string | number;
	version?: ContentVersion | null;
}>();

defineEmits(['revert']);

const { t } = useI18n();

const { collection, primaryKey, version } = toRefs(props);

const modalActive = ref(false);
const modalCurrentRevision = ref<number | null>(null);
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
} = useRevisions(collection, primaryKey, version);

onMounted(() => {
	getRevisionsCount();
});

watch(
	() => page.value,
	(newPage) => {
		refresh(newPage);
	},
);

function openModal(id: number) {
	modalCurrentRevision.value = id;
	modalActive.value = true;
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
		:title="t('revisions')"
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
	</sidebar-detail>
</template>

<style lang="scss" scoped>
.v-progress-linear {
	margin: 24px 0;
}

.v-divider {
	--v-divider-color: var(--theme--background-accent);

	margin-top: 24px;
	margin-bottom: 8px;

	&:first-of-type {
		margin-top: 0;
	}
}

.empty {
	margin-top: 16px;
	margin-bottom: 16px;
	margin-left: 2px;
	color: var(--theme--foreground-subdued);
	font-style: italic;
}

.external {
	margin-left: 20px;
	color: var(--theme--foreground-subdued);
	font-style: italic;
}

.other {
	--v-divider-label-color: var(--theme--foreground-subdued);

	font-style: italic;
}

.v-pagination {
	justify-content: center;
	margin-top: 24px;
}
</style>
