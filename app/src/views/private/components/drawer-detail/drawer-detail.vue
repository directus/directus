<template>
	<div class="drawer-detail" :class="{ open: drawerOpen }">
		<button class="toggle" @click="toggle" :class="{ open: active }">
			<div class="icon">
				<v-badge bordered :value="badge" :disabled="!badge">
					<v-icon :name="icon" outline />
				</v-badge>
			</div>
			<div class="title" v-show="drawerOpen">
				{{ title }}
			</div>
		</button>
		<div v-if="close" v-show="drawerOpen" class="close" @click="drawerOpen = false">
			<v-icon name="close" />
		</div>
		<transition-expand class="scroll-container">
			<div v-show="active">
				<div class="content">
					<slot />
				</div>
			</div>
		</transition-expand>
	</div>
</template>

<script lang="ts">
import { defineComponent, toRefs } from '@vue/composition-api';
import { useAppStore } from '@/stores';
import { useGroupable } from '@/composables/groupable';

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
		badge: {
			type: [String, Number],
			default: null,
		},
		close: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
		const { active, toggle } = useGroupable({
			value: props.title,
			group: 'drawer-detail',
		});
		const appStore = useAppStore();
		const { drawerOpen } = toRefs(appStore.state);
		return { active, toggle, drawerOpen };
	},
});
</script>

<style>
body {
	--drawer-detail-icon-color: var(--foreground-normal);
	--drawer-detail-color: var(--foreground-normal);
	--drawer-detail-color-active: var(--primary);
}
</style>

<style lang="scss" scoped>
.drawer-detail {
	--v-badge-offset-x: 2px;
	--v-badge-offset-y: 4px;
	--v-badge-border-color: var(--background-normal-alt);

	display: contents;

	.toggle {
		position: relative;
		flex-shrink: 0;
		width: 100%;
		height: 64px;
		color: var(--drawer-detail-color);
		background-color: var(--background-normal-alt);

		.icon {
			--v-icon-color: var(--drawer-detail-icon-color);

			display: flex;
			align-items: center;
			justify-content: center;
			width: 64px;
			height: 100%;
		}

		&.open,
		&:hover {
			color: var(--drawer-detail-color-active);
			.icon {
				--v-icon-color: var(--drawer-detail-color-active);
			}
		}
	}

	.close {
		position: absolute;
		top: 0;
		right: 0;
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 64px;
		height: 64px;
		color: var(--foreground-normal);
		cursor: pointer;
		transition: opacity var(--fast) var(--transition), color var(--fast) var(--transition);

		.v-icon {
			pointer-events: none;
		}

		&:hover {
			color: var(--drawer-detail-color-active);
		}
	}

	&.open {
		.toggle {
			.close {
				opacity: 1;
				pointer-events: auto;
			}
		}
	}

	.title {
		position: absolute;
		top: 50%;
		left: 52px;
		overflow: hidden;
		white-space: nowrap;
		transform: translateY(-50%);
	}

	.scroll-container {
		overflow-x: hidden;
		overflow-y: auto;
	}

	.content {
		padding: 16px;
		::v-deep {
			.format-markdown {
				a {
					color: var(--primary);
				}
			}
		}
	}
}
</style>
