<script setup lang="ts">
import { useRevisions } from '@/composables/use-revisions';
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

const { revisionsByDate, getRevisions, revisionsCount, getRevisionsCount, loading, loadingCount, pagesCount, refresh } =
	useRevisions(
		ref('directus_flows'),
		computed(() => unref(flow).id),
		ref(null),
		{
			action: Action.RUN,
		},
	);

watch(
	() => page.value,
	(newPage) => {
		refresh(newPage);
	},
);

onMounted(() => {
	getRevisionsCount();
	if (open.value) getRevisions();
});

const previewing = ref();

function onToggle(open: boolean) {
	if (open && revisionsByDate.value === null) getRevisions();
}
</script>

<template>
	<sidebar-detail
		:title
		icon="fact_check"
		:badge="!loadingCount && revisionsCount > 0 ? abbreviateNumber(revisionsCount) : null"
		@toggle="onToggle"
	>
		<v-progress-linear v-if="!revisionsByDate && loading" indeterminate />

		<div v-else-if="revisionsCount === 0" class="empty">{{ t('no_logs') }}</div>

		<v-detail
			v-for="group in revisionsByDate"
			v-else
			:key="group.dateFormatted"
			:label="group.dateFormatted"
			class="revisions-date-group"
			start-open
		>
			<div class="scroll-container">
				<div v-for="revision in group.revisions" :key="revision.id" class="log">
					<button @click="previewing = revision">
						<v-icon name="play_arrow" color="var(--theme--primary)" small />
						{{ revision.timeRelative }}
					</button>
				</div>
			</div>
		</v-detail>

		<v-pagination v-if="pagesCount > 1" v-model="page" :length="pagesCount" :total-visible="3" />
	</sidebar-detail>

	<LogsDrawer :revision-id="previewing?.id" :flow="props.flow" @close="previewing = null" />
</template>

<style lang="scss" scoped>
.v-progress-linear {
	margin: 24px 0;
}

.content {
	padding: var(--content-padding);
}

.log {
	position: relative;
	display: block;

	button {
		position: relative;
		z-index: 2;
		display: block;
		width: 100%;
		text-align: left;
	}

	&::before {
		position: absolute;
		top: -4px;
		left: -4px;
		z-index: 1;
		width: calc(100% + 8px);
		height: calc(100% + 8px);
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
		margin-top: 8px;
	}
}

.json {
	background-color: var(--theme--background-subdued);
	font-family: var(--theme--fonts--monospace--font-family);
	border-radius: var(--theme--border-radius);
	padding: 20px;
	margin-top: 20px;
	white-space: pre-wrap;
	overflow-wrap: break-word;
}

.steps {
	position: relative;

	.step {
		position: relative;

		&::after {
			content: '';
			position: absolute;
			width: var(--theme--border-width);
			left: -11px;
			top: 0;
			background-color: var(--theme--border-color-subdued);
			height: 100%;
		}

		&:first-child::after {
			top: 8px;
			height: calc(100% - 8px);
		}

		&:last-child::after {
			height: 12px;
		}

		.inset {
			padding-top: 12px;
			padding-bottom: 32px;

			.v-detail + .v-detail {
				margin-top: 12px;
			}
		}

		.subdued {
			color: var(--theme--foreground-subdued);
		}
	}

	.mono {
		font-family: var(--theme--fonts--monospace--font-family);
		color: var(--theme--foreground-subdued);
	}

	.dot {
		position: absolute;
		top: 6px;
		left: -16px;
		z-index: 2;
		width: 12px;
		height: 12px;
		background-color: var(--theme--primary);
		border: var(--theme--border-width) solid var(--theme--background);
		border-radius: 8px;

		&.resolve {
			background-color: var(--theme--primary);
		}

		&.reject {
			background-color: var(--theme--secondary);
		}
	}
}

.empty {
	margin-left: 2px;
	color: var(--theme--foreground-subdued);
	font-style: italic;
}

.v-pagination {
	justify-content: center;
	margin-top: 24px;
}
</style>
