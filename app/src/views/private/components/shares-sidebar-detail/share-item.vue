<template>
	<div class="share-item" @click="click">
		<div class="share-item-header">
			<span class="type-label">{{ share.name }}</span>
			<span class="share-item-date">{{ d(new Date(share.date_created), 'short') }}</span>
		</div>
		<div class="share-item-info">
			<span class="share-uses" :class="{ 'no-left': uses_left === 0 }">
				<template v-if="uses_left === null">{{ t('unlimited_usage') }}</template>
				<template v-else>{{ t('uses_left', uses_left) }}</template>
			</span>
			<v-icon v-if="share.password" small name="lock" />
			<span style="flex-grow: 1"></span>
			<span v-if="status" class="share-status" :class="{ [status]: true }">
				{{ t(status) }}
			</span>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useI18n } from 'vue-i18n';

export default defineComponent({
	props: {
		share: {
			type: Object,
			required: true,
		},
	},
	emits: ['click'],
	setup(props, { emit }) {
		const { t, d } = useI18n();

		const uses_left = computed(() => {
			if (props.share.max_uses === null) return null;
			return props.share.max_uses - props.share.times_used;
		});

		const status = computed(() => {
			if (props.share.date_end && new Date(props.share.date_end) < new Date()) {
				return 'expired';
			}
			if (props.share.date_start && new Date(props.share.date_start) > new Date()) {
				return 'upcoming';
			}
			return null;
		});

		function click() {
			emit('click', props.share.id);
		}
		return { uses_left, status, click, t, d };
	},
});
</script>

<style lang="scss" scoped>
.share-item {
	margin-bottom: 8px;
	padding: 8px;
	background-color: var(--background-page);
	border-radius: var(--border-radius);

	&:hover {
		cursor: pointer;
	}
}

.share-item-date {
	color: var(--foreground-subdued);
	font-size: 12px;
}

.share-item-header {
	display: flex;
	justify-content: space-between;
	margin-bottom: 0;
}

.share-item-info {
	display: flex;
	align-items: center;
	color: var(--foreground-subdued);
}

.share-uses {
	margin-right: 5px;
	font-size: 12px;

	&.no-left {
		color: var(--danger);
	}
}

.share-status {
	font-weight: 600;
	font-size: 12px;
	text-align: end;
	text-transform: uppercase;

	&.expired {
		color: var(--warning);
	}

	&.upcoming {
		color: var(--green);
	}
}
</style>
