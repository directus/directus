<template>
	<div class="share-item" @click="click">
		<div class="share-item-header">
			<span class="share-item-name">{{ share.name }}</span>
			<span class="share-item-date">{{ d(new Date(share.date_created), 'short') }}</span>
		</div>
		<div class="share-item-info">
			<span class="share-uses" :class="{ 'no-left': uses_left === 0 }">
				<template v-if="uses_left === null">{{ t('unlimited_usage') }}</template>
				<template v-else>{{ t('uses_left', uses_left) }}</template>
			</span>
			<v-icon v-if="share.password" name="lock" />
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
	margin: 10px 0px;
	padding: 10px;
	background-color: var(--background-page);
	border-radius: var(--border-radius);

	&:first-child {
		margin-top: 0;
	}

	&:hover {
		cursor: pointer;
	}
}

.share-item-header {
	display: flex;
	justify-content: space-between;
	margin-bottom: 5px;
}

.share-item-name {
	font-weight: 700;
	font-size: 18px;
}

.share-item-info {
	display: flex;
	color: var(--foreground-subdued);
}

.share-uses {
	margin-right: 5px;

	&.no-left {
		color: var(--danger);
	}
}

.share-status {
	flex-grow: 1;
	font-weight: 600;
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
