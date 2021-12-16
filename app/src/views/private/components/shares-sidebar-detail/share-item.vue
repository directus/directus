<template>
	<div class="share-item" @click="click">
		<div class="share-item-header">
			<span class="share-item-name">{{ share.name }}</span>
			<span class="share-item-date">{{ d(new Date(share.date_created), 'short') }}</span>
		</div>
		<div class="share-item-info">
			<span class="share-uses-left">
				<template v-if="!share.max_uses">{{ t('unlimited_usage') }}</template>
				<template v-else>{{ t('uses_left', uses_left) }}</template>
				<v-icon v-if="share.password" name="lock" />
			</span>
			<span v-if="share.date_end && new Date(share.date_end) < new Date()" class="share-expired">
				{{ t('expired') }}
			</span>
			<span v-else-if="share.date_start && new Date(share.date_start) > new Date()" class="share-upcoming">
				{{ t('upcoming') }}
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
			if (props.share.max_uses === null) return undefined;
			return props.share.max_uses - props.share.times_used;
		});

		function click() {
			emit('click', props.share.id);
		}
		return { uses_left, click, t, d };
	},
});
</script>

<style lang="scss" scoped>
.share-item {
	margin: 5px;
	margin-bottom: 10px;
	padding: 10px;
	background-color: var(--background-page);
	border-radius: var(--border-radius);

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
	justify-content: space-between;
	color: var(--foreground-subdued);
}

.share-expired {
	color: var(--warning);
	text-transform: uppercase;
}

.share-upcoming {
	color: var(--green);
	text-transform: uppercase;
}
</style>
