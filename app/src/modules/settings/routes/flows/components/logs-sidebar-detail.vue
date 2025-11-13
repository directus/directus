<script setup lang="ts">
import VDetail from '@/components/v-detail.vue';
import { useRevisions } from '@/composables/use-revisions';
import SidebarDetail from '@/views/private/components/sidebar-detail.vue';
import { useGroupable } from '@directus/composables';
import { Action } from '@directus/constants';
import type { FlowRaw } from '@directus/types';
import { abbreviateNumber } from '@directus/utils';
import { computed, onMounted, ref, toRefs, unref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import LogsDrawer from './logs-drawer.vue';

const props = defineProps<{
	flow: FlowRaw;
}>();

const { flow } = toRefs(props);

const { t } = useI18n();

const title = computed(() => t('logs'));

const { active: open } = useGroupable({
	value: title.value,
	group: 'sidebar-detail',
});

const page = ref<number>(1);
const selectedRevision = ref();
const showFailedOnly = ref(false);

const { revisionsByDate, getRevisions, revisionsCount, getRevisionsCount, loading, loadingCount, pagesCount, refresh } =
	useRevisions(
		ref('directus_flows'),
		computed(() => unref(flow).id),
		ref(null),
		{
			action: Action.RUN,
			full: true,
		},
	);

watch([() => page.value, () => showFailedOnly.value], async () => {
	await refresh(page.value);
	if (showFailedOnly.value) filterRevisions();
});

function filterRevisions() {
	if (!revisionsByDate.value) return;

	revisionsByDate.value = revisionsByDate.value
		.map((group) => ({
			...group,
			revisions: group.revisions.filter((r) => r.status === 'reject'),
		}))
		.filter((group) => group.revisions.length > 0);
}

onMounted(() => {
	getRevisionsCount();
	if (open.value) getRevisions();
});

function onToggle(open: boolean) {
	if (open && revisionsByDate.value === null) getRevisions();
}
</script>

<template>
	<sidebar-detail
		id="logs"
		:title
		icon="fact_check"
		:badge="!loadingCount && revisionsCount > 0 ? abbreviateNumber(revisionsCount) : null"
		@toggle="onToggle"
	>
		<v-progress-linear v-if="!revisionsByDate && loading" indeterminate />

		<div v-else-if="revisionsCount === 0" class="empty">{{ $t('no_logs') }}</div>

		<template v-else>
			<button class="toggle-failed" :class="{ active: showFailedOnly }" @click="showFailedOnly = !showFailedOnly">
				<v-icon v-if="!showFailedOnly" name="circle" small />
				<v-icon v-else name="cancel" small />
				{{ $t('show_failed_only') }}
			</button>

			<div v-if="!revisionsByDate?.length" class="empty">{{ $t('no_logs_on_page') }}</div>

			<v-detail
				v-for="group in revisionsByDate"
				:key="group.dateFormatted"
				:label="group.dateFormatted"
				class="revisions-date-group"
				start-open
			>
				<div class="scroll-container">
					<div v-for="revision in group.revisions" :key="revision.id" class="log">
						<button @click="selectedRevision = revision">
							<v-icon v-if="revision.status === 'resolve'" name="check_circle" color="var(--theme--primary)" small />
							<v-icon v-else name="cancel" color="var(--theme--secondary)" small />
							{{ revision.timeRelative }}
						</button>
					</div>
				</div>
			</v-detail>
		</template>

		<v-pagination v-if="pagesCount > 1" v-model="page" :length="pagesCount" :total-visible="3" />
	</sidebar-detail>

	<logs-drawer :flow="flow" :revision="selectedRevision" @close="selectedRevision = null"></logs-drawer>
</template>

<style lang="scss" scoped>
.v-progress-linear {
	margin: 24px 0;
}

.v-detail + .v-detail {
	margin-block-start: 12px;
}

.v-icon {
	vertical-align: text-top;
}

.toggle-failed {
	color: var(--theme--foreground-subdued);
	transition: color var(--fast) var(--transition);
	margin-block-end: 24px;

	&.active,
	&:hover {
		color: var(--theme--foreground);
	}
}

.log {
	position: relative;
	display: block;

	button {
		position: relative;
		z-index: 2;
		display: block;
		inline-size: 100%;
		text-align: start;
	}

	&::before {
		position: absolute;
		inset-block-start: -4px;
		inset-inline-start: -4px;
		z-index: 1;
		inline-size: calc(100% + 8px);
		block-size: calc(100% + 8px);
		background-color: var(--theme--background-accent);
		border-radius: var(--theme--border-radius);
		opacity: 0;
		transition: opacity var(--fast) var(--transition);
		content: '';
		pointer-events: none;
	}

	&:hover {
		cursor: pointer;

		.header {
			.dot {
				border-color: var(--theme--background-accent);
			}
		}

		&::before {
			opacity: 1;
		}
	}

	& + & {
		margin-block-start: 8px;
	}
}

.empty {
	margin-inline-start: 2px;
	color: var(--theme--foreground-subdued);
	font-style: italic;
}

.v-pagination {
	justify-content: center;
	margin-block-start: 32px;
}
</style>
