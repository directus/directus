<template>
	<div class="share-item" @click="click">
		<div class="share-item-header">
			<span class="share-item-name">{{ share.name }}</span>
			<span class="share-item-date">{{ d(new Date(share.date_created), 'short') }}</span>
		</div>
		<div class="share-item-info">
			<span class="share-uses-left">
				{{ t('uses_left', { n: uses_left }) }}
				<v-icon v-if="share.password" name="lock" />
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
			if (props.share.max_uses == undefined) return undefined;
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
	background-color: white;
	border-radius: 3px;

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

.share-uses-left {
	color: var(--foreground-subdued);
}
</style>
