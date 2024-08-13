<script setup lang="ts">
import { localizedFormat } from '@/utils/localized-format';
import { nextTick, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller';
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';
import { Log } from '../types';

interface Props {
	logs: Log[];
	logLevels: Record<string, number>;
	instances: string[];
	unreadLogsCount: number;
}

const props = defineProps<Props>();
const emit = defineEmits(['expandLog', 'scrolledToBottom', 'scrolledToTop', 'scroll']);

defineExpose({ scrollToBottom, scrollToTop, scrollDownByOne, scrollUpByOne });

const { t } = useI18n();
const scroller = ref();
const unreadLogsChipVisible = ref(true);
const scrollInterval = 10;
const logHeight = 36;
let isNearBottom = true;
let lastScrollHeight = 0;

const logLevelMap = Object.entries(props.logLevels).reduce(
	(acc, [logLevelName, logLevelValue]) => {
		acc[logLevelValue] = logLevelName;
		return acc;
	},
	{} as Record<number, string>,
);

function getMessageClasses(existingClasses: string[], item: Log) {
	return [...existingClasses, { subdued: logLevelMap[item.data.level] === 'trace' }];
}

let currentScrollController: AbortController | null = null;

function scrollTo(
	target: number | 'bottom' | 'top',
	stepSize: number,
	isFixedStep: boolean,
	emitEvent?: Parameters<typeof emit>[0],
) {
	if (currentScrollController) {
		currentScrollController.abort();
	}

	currentScrollController = new AbortController();
	const { signal } = currentScrollController;
	const scrollerEl = scroller.value.$el;

	lastScrollHeight = scrollerEl.scrollTop;

	function scrollStepFn() {
		if (signal.aborted) return;

		if (scrollerEl.scrollTop !== lastScrollHeight) {
			currentScrollController = null;
			return;
		}

		const totalHeight = scrollerEl.scrollHeight;
		const isScrollingDown = stepSize > 0;
		let targetHeight;

		if (target === 'top') targetHeight = 0;
		else if (target === 'bottom') targetHeight = scrollerEl.scrollHeight;
		else targetHeight = target;

		const targetReached = isScrollingDown
			? scrollerEl.scrollTop + scrollerEl.clientHeight >= (isFixedStep ? targetHeight : totalHeight)
			: scrollerEl.scrollTop <= target;

		if (!targetReached) {
			scrollerEl.scrollTop += stepSize;

			setTimeout(() => {
				requestAnimationFrame(scrollStepFn);
			}, scrollInterval);
		} else {
			currentScrollController = null;
			scrollerEl.scrollTop = targetHeight;

			if (emitEvent) {
				emit(emitEvent);
			}
		}

		lastScrollHeight = scrollerEl.scrollTop;
	}

	scrollStepFn();
}

async function scrollToBottom() {
	await nextTick();
	const scrollerEl = scroller.value.$el;
	unreadLogsChipVisible.value = false;

	if (isNearBottom) {
		scrollerEl.scrollTop = scrollerEl.scrollHeight;
		onScrollToBottom();
	} else {
		scrollTo(scrollerEl.scrollHeight, scrollerEl.scrollHeight / 20, false, 'scrolledToBottom');
	}
}

async function scrollToTop() {
	await nextTick();
	scrollTo(0, -scroller.value.$el.scrollHeight / 20, false, 'scrolledToTop');
}

async function scrollDownByOne() {
	await nextTick();
	const targetScrollTop = scroller.value.$el.scrollTop + logHeight;
	scrollTo(targetScrollTop, logHeight, true);
}

async function scrollUpByOne() {
	await nextTick();
	let targetScrollTop = scroller.value.$el.scrollTop - logHeight;

	if (targetScrollTop < 0) {
		targetScrollTop = 0;
	}

	scrollTo(targetScrollTop, -logHeight, true);
}

function onScroll(event: any) {
	if (currentScrollController) {
		return;
	}

	const scrollerEl = scroller.value.$el;

	isNearBottom = scrollerEl.scrollTop + scrollerEl.clientHeight >= scrollerEl.scrollHeight - 10;

	if (isNearBottom) {
		onScrollToBottom();
	} else {
		emit('scroll', event);
	}
}

function onScrollToBottom() {
	emit('scrolledToBottom');
	unreadLogsChipVisible.value = true;
}
</script>

<template>
	<dynamic-scroller
		ref="scroller"
		:items="logs"
		key-field="index"
		:min-item-size="30"
		class="logs-display"
		@scroll="onScroll"
	>
		<template #before>
			<div class="notice">This is the beginning of your logs session...</div>
		</template>
		<template #after>
			<div class="notice">Awaiting more logs...</div>
		</template>
		<template #default="{ item, index, active }">
			<dynamic-scroller-item
				:item="item"
				:active="active"
				:size-dependencies="[item.data.msg]"
				:data-index="index"
				:data-active="active"
			>
				<div :class="['log-entry', { maximized: item.selected }]" @click="emit('expandLog', item.index)">
					<span class="timestamp">[{{ localizedFormat(item.data.time, `${t('date-fns_time_24hour')}`) }}]</span>
					<span v-if="!item.notice" :class="getMessageClasses(['instance'], item)">
						[#{{ instances.indexOf(item.instance) + 1 }}]
					</span>
					<span v-if="!item.notice" :class="getMessageClasses(['log-level', logLevelMap[item.data.level] || ''], item)">
						{{ logLevelMap[item.data.level]?.toLocaleUpperCase() }}
					</span>
					<span
						v-if="item.data.req?.method && item.data.req?.url && item.data.res?.statusCode && item.data.responseTime"
						:class="getMessageClasses(['message'], item)"
					>
						{{ item.data.req.method }} {{ item.data.req.url }} {{ item.data.res.statusCode }}
						{{ item.data.responseTime }}ms
					</span>
					<span v-else :class="getMessageClasses(['message'], item)">
						{{ item.data.msg }}
					</span>
				</div>
			</dynamic-scroller-item>
		</template>
	</dynamic-scroller>
	<div class="unread-logs">
		<v-chip
			class="unread-chip"
			:active="unreadLogsChipVisible && unreadLogsCount > 0"
			small
			close
			@click="scrollToBottom"
			@close="unreadLogsChipVisible = false"
		>
			<v-icon name="arrow_downward" small />
			{{ unreadLogsCount }} UNREAD
		</v-chip>
	</div>
</template>

<style lang="scss" scoped>
.wrapper {
	width: 100%;
	height: 100%;
}

.notice {
	margin: 6px;
	padding-left: 6px;
	font-family: var(--theme--fonts--monospace--font-family);
	color: var(--theme--foreground-subdued);
}

.logs-display {
	min-height: 300px;
	height: 100%;
}

.log-entry:hover:not(.maximized) {
	background-color: var(--theme--background-normal);
}

.log-entry {
	display: flex;
	align-items: center;
	justify-content: space-between;
	font-family: var(--theme--fonts--monospace--font-family);
	color: var(--theme--foreground);
	padding: 6px;
	cursor: pointer;
}

.log-entry > span {
	padding: 0 6px 0 6px;
}

.message {
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
	flex-grow: 1;
}

.maximized {
	background-color: var(--theme--background-accent);
}

.unread-logs {
	position: relative;
	width: 100%;
	bottom: 60px;
	text-align: center;
}

.unread-chip {
	--v-chip-color: var(--theme--foreground-accent);
	--v-chip-background-color: var(--theme--primary);
	--v-chip-close-color: var(--theme--primary);

	cursor: pointer;
	box-shadow: var(--sidebar-shadow);

	.v-icon {
		margin: 0 4px 0 4px;
	}

	span .close {
		--v-icon-color: red !important;
	}
}

.log-level {
	border-radius: var(--v-input-border-radius, var(--theme--border-radius));
}

.trace {
	color: var(--theme--foreground-subdued);
}

.info {
	color: var(--blue);
}

.warn {
	color: var(--yellow);
}

.error {
	color: var(--red);
}

.fatal {
	color: var(--red);
	background-color: var(--red-25);
}

.subdued {
	color: var(--theme--foreground-subdued);
}
</style>
