<script setup lang="ts">
import { localizedFormat } from '@/utils/localized-format';
import { nextTick, ref } from 'vue';
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller';
import { Log } from '../types';

import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';

interface Props {
	logs: Log[];
	logLevels: Record<string, number>;
	instances: string[];
	streamConnected: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(['logSelected', 'scrolledToBottom', 'scrolledToTop', 'scroll']);

defineExpose({ clearUnreadLogs, incrementUnreadLogs, scrollToBottom, scrollToTop, scrollDownByOne, scrollUpByOne });

const { n, t } = useI18n();
const scroller = ref();
const unreadLogsChipVisible = ref(true);
const unreadLogsCount = ref(0);
const scrollInterval = 10;
const logHeight = 36;
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

function clearUnreadLogs() {
	unreadLogsCount.value = 0;
}

function incrementUnreadLogs(count: number) {
	if (hasScrollBar()) {
		unreadLogsCount.value += count;
	}
}

let currentScrollController: AbortController | null = null;

function isNearBottom() {
	const scrollerEl = scroller.value.$el;
	return scrollerEl.scrollTop + scrollerEl.clientHeight >= scrollerEl.scrollHeight - 10;
}

function hasScrollBar() {
	const scrollerEl = scroller.value.$el;
	return scrollerEl.scrollHeight > scrollerEl.clientHeight;
}

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

			if (target === 'bottom') {
				onScrollToBottom();
			} else if (emitEvent) {
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

	if (!hasScrollBar()) return;

	unreadLogsChipVisible.value = false;

	if (isNearBottom()) {
		scrollerEl.scrollTop = scrollerEl.scrollHeight;
		onScrollToBottom();
	} else {
		scrollTo('bottom', scrollerEl.scrollHeight / 20, false, 'scrolledToBottom');
	}
}

async function scrollToTop() {
	await nextTick();

	const scrollerEl = scroller.value.$el;

	scrollerEl.style.scrollSnapType = 'none';
	scrollTo('top', -scroller.value.$el.scrollHeight / 20, false, 'scrolledToTop');
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

	if (isNearBottom()) {
		onScrollToBottom();
	} else {
		scrollerEl.style.scrollSnapType = 'none';
		emit('scroll', event);
	}
}

function onScrollToBottom() {
	const scrollerEl = scroller.value.$el;

	scrollerEl.style.scrollSnapType = 'y mandatory';
	unreadLogsChipVisible.value = true;

	emit('scrolledToBottom');
}

function selectLog(index: number) {
	const scrollerEl = scroller.value.$el;

	scrollerEl.style.scrollSnapType = 'none';
	emit('logSelected', index);
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
			<div class="notice">{{ $t('logs_beginning') }}</div>
		</template>
		<template #after>
			<div v-if="streamConnected" class="notice">{{ $t('logs_waiting') }}</div>
		</template>
		<template #default="{ item, index, active }">
			<dynamic-scroller-item :item="item" :active="active" :data-index="index" :data-active="active">
				<div :class="['log-entry', { selected: item.selected }]" @click="selectLog(item.index)">
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
			clickable
			@click="scrollToBottom"
			@close="unreadLogsChipVisible = false"
		>
			<v-icon name="arrow_downward" x-small />
			<span class="label">{{ $t('logs_unread_count', { count: n(unreadLogsCount) }) }}</span>
		</v-chip>
	</div>
</template>

<style lang="scss" scoped>
.wrapper {
	inline-size: 100%;
	block-size: 100%;
}

.notice {
	margin: 6px;
	padding-inline-start: 6px;
	font-family: var(--theme--fonts--monospace--font-family);
	color: var(--theme--foreground-subdued);
}

.logs-display {
	min-block-size: 200px;
	block-size: 100%;
	scroll-snap-type: y proximity;
	align-content: end;
}

.logs-display::after {
	display: block;
	content: '';
	scroll-snap-align: end;
}

.log-entry:hover:not(.selected) {
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
	padding: 0 6px;
}

.message {
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
	flex-grow: 1;
}

.selected {
	background-color: var(--theme--background-accent);
}

.unread-logs {
	position: relative;
	inline-size: 100%;
	inset-block-end: 60px;
	text-align: center;
}

.unread-chip {
	--v-chip-color: var(--white);
	--v-chip-background-color: var(--theme--primary);
	--v-chip-close-color: var(--theme--primary);

	cursor: pointer;
	box-shadow: var(--sidebar-shadow);

	.v-icon {
		margin-inline-end: 8px;
	}

	.label {
		font-weight: bold;
		font-size: 12px;
		text-transform: uppercase;
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
