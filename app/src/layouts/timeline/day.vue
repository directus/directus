<template>
	<div ref="dayElement" class="day" :class="{ first: day.day === 1 }">
		<div class="day-date">
			<div class="sticky">
				<div class="date">{{ format(date, 'd MMM') }}</div>
				<div class="week-day">{{ format(date, 'iii') }}</div>
			</div>
		</div>
		<div class="events">
			<div v-for="event in events" :key="event.id" class="event" @click="toEvent(event)">
				<v-avatar
					v-if="event?.user"
					v-tooltip.bottom="`${event.user.first_name} ${event.user.last_name}`"
					class="avatar"
				>
					<img v-if="event.user.image" :src="event.user.image" />
					<v-icon v-else name="person" />
				</v-avatar>
				<span class="title">
					<render-template
						:collection="collection"
						:fields="fieldsInCollection"
						:item="event.item"
						:template="event.title"
					></render-template>
					<div v-tooltip="format(event.time, 'PPP h:mm:ss a')" class="time">{{ format(event.time, 'h:mmaaa') }}</div>
				</span>
				<v-icon name="open_in_new" class="icon" />
			</div>
			<div v-for="index in placeholderCount" :key="index" class="event">
				<v-skeleton-loader v-if="userField !== null" type="avatar" />
				<span class="title">
					<v-skeleton-loader type="text" class="template" />
					<v-skeleton-loader type="text" class="time" />
				</span>
				<v-icon name="open_in_new" class="icon" />
			</div>
			<div v-if="eventsLeft > 0 && visible" class="show-more" @click="loadMore">
				{{ t('layouts.timeline.show_more', { count: eventsLeft }) }}
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, toRefs, ref, onMounted, onUnmounted } from 'vue';
import { Day, Event } from './types';
import { format } from 'date-fns';
import { useI18n } from 'vue-i18n';
import { UseEvents } from '.';
import { Field } from '@directus/shared/types';
import { router } from '@/router';
import { throttle } from 'lodash';

export default defineComponent({
	inheritAttrs: false,
	props: {
		day: {
			type: Object as PropType<Day>,
			required: true,
		},
		useEvents: {
			type: Function as PropType<UseEvents>,
			required: true,
		},
		collection: {
			type: String,
			required: true,
		},
		fieldsInCollection: {
			type: Array as PropType<Field[]>,
			required: true,
		},
		userField: {
			type: String,
			default: null,
		},
	},
	setup(props) {
		const { t } = useI18n();
		const { day } = toRefs(props);

		const dayElement = ref<HTMLDivElement>();
		const visible = ref(false);
		const limit = ref(Math.min(5, day.value.event_count));

		const date = computed(() => new Date(props.day.year, props.day.month - 1, props.day.day));

		const { events, loading } = props.useEvents(day, limit, visible);

		const placeholderCount = computed(() => {
			if (loading.value === false && visible.value) return 0;
			return limit.value - events.value.length;
		});

		const eventsLeft = computed(() => day.value.event_count - events.value.length - placeholderCount.value);

		const updateVisibility = throttle(() => {
			if (visible.value) return;

			const document = window.document;
			if (!dayElement.value) {
				visible.value = false;
			} else {
				const rect = dayElement.value.getBoundingClientRect();

				const visibilityOffset = 500;

				visible.value =
					rect.top <= (window.innerHeight || document.documentElement.clientHeight) + visibilityOffset &&
					rect.bottom >= -visibilityOffset;
			}
		}, 200);

		onMounted(() => {
			updateVisibility();
			document.getElementById('main-content')?.addEventListener('scroll', updateVisibility);
		});

		onUnmounted(() => {
			document.getElementById('main-content')?.removeEventListener('scroll', updateVisibility);
		});

		return {
			date,
			format,
			t,
			events,
			loadMore,
			toEvent,
			placeholderCount,
			eventsLeft,
			dayElement,
			visible,
			limit,
			loading,
		};

		function toEvent(event: Event) {
			router.push(`/content/${props.collection}/${event.id}`);
		}

		function loadMore() {
			limit.value += Math.min(50, eventsLeft.value);
		}
	},
});
</script>

<style lang="scss" scoped>
.day {
	position: inherit;
	margin-bottom: 32px;
	display: flex;

	&.first {
		border-bottom: var(--border-width) solid var(--border-subdued);
		padding-bottom: 10px;
		margin-bottom: 22px;
	}

	.sticky {
		position: sticky;
		top: 68px;
	}

	.day-date {
		min-width: 90px;

		.date {
			font-weight: 700;
			font-size: 18px;
			color: var(--foreground-normal-alt);
		}

		.week-day {
			margin-top: -4px;
			color: var(--foreground-subdued);
			font-weight: 600;
			font-size: 16px;
		}
	}

	.events {
		flex: 1;

		.event {
			display: flex;
			align-items: center;
			margin-bottom: 12px;
			padding: 8px 16px;
			border: var(--border-width) solid var(--border-subdued);
			border-radius: var(--border-radius);
			cursor: pointer;
			transition: all var(--transition) var(--fast);

			.icon {
				margin-left: auto;
				color: var(--foreground-subdued);
			}

			&:hover {
				border-color: var(--border-normal);

				.icon {
					color: var(--foreground-normal);
				}
			}

			.avatar {
				margin-right: 10px;
				border-radius: 24px;
			}

			.title {
				.v-skeleton-loader {
					width: 300px;
					height: 20.4px;
				}

				.template.v-skeleton-loader {
					margin-bottom: 8px;
				}

				.time {
					color: var(--foreground-subdued);

					&.v-skeleton-loader {
						width: 100px;
						height: 20.4px;
					}
				}
			}
		}

		.show-more {
			color: var(--foreground-normal);
			font-weight: 600;
			cursor: pointer;
			transition: color var(--transition) var(--fast);

			&:hover {
				color: var(--foreground-normal-alt);
			}
		}
	}
}
</style>
