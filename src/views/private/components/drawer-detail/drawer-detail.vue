<template>
	<div class="drawer-detail">
		<button class="toggle" @click="toggle" :class="{ open: active }">
			<div class="icon">
				<v-icon :name="icon" />
			</div>
			<div class="title" v-show="drawerOpen">
				{{ title }}
			</div>
		</button>
		<transition-expand>
			<div v-show="active">
				<div class="content">
					<slot />
				</div>
			</div>
		</transition-expand>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, inject } from '@vue/composition-api';
import { useGroupable } from '@/compositions/groupable';

export default defineComponent({
	props: {
		icon: {
			type: String,
			required: true,
		},
		title: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const { active, toggle } = useGroupable(props.title, 'drawer-detail');
		const drawerOpen = inject('drawer-open', ref(false));
		return { active, toggle, drawerOpen };
	},
});
</script>

<style lang="scss" scoped>
.drawer-detail {
	.toggle {
		position: relative;
		width: 100%;
		height: 64px;
		color: var(--foreground-normal);
		transition: background-color var(--fast) var(--transition);

		&:not(.open):hover {
			background-color: var(--background-normal-alt);
		}

		&.open {
			background-color: var(--background-normal-alt);
		}
	}

	.icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 64px;
		height: 100%;
	}

	.title {
		position: absolute;
		top: 50%;
		left: 52px;
		overflow: hidden;
		white-space: nowrap;
		transform: translateY(-50%);
	}

	.content {
		padding: 12px;
	}
}
</style>
