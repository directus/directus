<template>
	<sidebar-detail
		:title="t('revisions')"
		icon="change_history"
		:badge="!loading && revisionsCount > 0 ? abbreviateNumber(revisionsCount) : null"
	>
		<v-progress-linear v-if="loading" indeterminate />

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
			<v-pagination v-if="pagesCount > 1" v-model="page" :length="pagesCount" :total-visible="2" />
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

<script setup lang="ts">
import { useRevisions } from '@/composables/use-revisions';
import { abbreviateNumber } from '@directus/utils';
import { ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import RevisionsDateGroup from './revisions-date-group.vue';
import RevisionsDrawer from './revisions-drawer.vue';

interface Props {
	collection: string;
	primaryKey: string | number;
}

const props = defineProps<Props>();

defineEmits(['revert']);

const { t } = useI18n();

const { collection, primaryKey } = toRefs(props);

const { revisions, revisionsByDate, loading, refresh, revisionsCount, pagesCount, created } = useRevisions(
	collection,
	primaryKey
);

const modalActive = ref(false);
const modalCurrentRevision = ref<number | null>(null);
const page = ref<number>(1);

watch(
	() => page.value,
	(newPage) => {
		refresh(newPage);
	}
);

function openModal(id: number) {
	modalCurrentRevision.value = id;
	modalActive.value = true;
}

defineExpose({
	refresh,
});
</script>

<style lang="scss" scoped>
.v-progress-linear {
	margin: 24px 0;
}

.v-divider {
	--v-divider-color: var(--background-normal-alt);

	position: sticky;
	top: 0;
	z-index: 3;
	margin-top: 8px;
	margin-right: -8px;
	margin-bottom: 6px;
	margin-left: -8px;
	padding-top: 8px;
	padding-right: 8px;
	padding-left: 8px;
	background-color: var(--background-normal);
	box-shadow: 0 0 2px 2px var(--background-normal);

	&:first-of-type {
		margin-top: 0;
	}
}

.empty {
	margin-top: 16px;
	margin-bottom: 16px;
	margin-left: 2px;
	color: var(--foreground-subdued);
	font-style: italic;
}

.external {
	margin-left: 20px;
	color: var(--foreground-subdued);
	font-style: italic;
}

.other {
	--v-divider-label-color: var(--foreground-subdued);

	font-style: italic;
}

.v-pagination {
	justify-content: center;
}
</style>
