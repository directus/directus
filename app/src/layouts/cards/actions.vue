<template>
	<transition name="fade">
		<span v-if="itemCount" class="item-count" :title="showingCount">
			{{ showingCount }}
		</span>
	</transition>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	inheritAttrs: false,
	props: {
		itemCount: {
			type: Number,
			default: null,
		},
		showingCount: {
			type: String,
			required: true,
		},
	},
});
</script>

<style lang="scss" scoped>
.item-count {
	position: relative;
	display: none;
	margin-right: 8px;
	color: var(--foreground-subdued);
	white-space: nowrap;
	text-overflow: ellipsis;
	overflow: hidden;

	@media (min-width: 600px) {
		display: inline;
	}
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity var(--medium) var(--transition);
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
</style>
