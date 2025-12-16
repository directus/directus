<script setup lang="ts">
import VIcon from '@/components/v-icon/v-icon.vue';

defineProps<{
	icon: string;
	hideAvatarBackground?: boolean;
}>();
</script>

<template>
	<div class="v-banner">
		<div class="avatar" :class="{ 'no-bg': hideAvatarBackground }">
			<slot name="avatar"><v-icon :name="icon" large /></slot>
		</div>

		<div class="content">
			<div class="headline"><slot name="headline" /></div>
			<div class="title"><slot /></div>
			<div class="subtitle"><slot name="subtitle" /></div>
		</div>

		<svg class="art" viewBox="0 0 989 200" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect
				x="27.4664"
				y="35.2082"
				width="60"
				height="60"
				rx="8"
				transform="rotate(-15 27.4664 35.2082)"
				fill="var(--theme--banner--art--foreground)"
			/>
			<rect
				x="-70.5131"
				y="-21.3604"
				width="140"
				height="60"
				rx="8"
				transform="rotate(-15 -70.5131 -21.3604)"
				fill="var(--theme--banner--art--foreground)"
			/>
			<rect
				x="-49.8076"
				y="55.9137"
				width="60"
				height="60"
				rx="8"
				transform="rotate(-15 -49.8076 55.9137)"
				fill="var(--theme--banner--art--foreground)"
			/>
			<rect
				x="589.091"
				y="-32.4564"
				width="140"
				height="140"
				rx="8"
				transform="rotate(-15 589.091 -32.4564)"
				fill="var(--theme--banner--art--foreground)"
			/>
			<rect
				x="883.029"
				y="137.249"
				width="140"
				height="140"
				rx="8"
				transform="rotate(-15 883.029 137.249)"
				fill="var(--theme--banner--art--foreground)"
			/>
			<rect
				x="413.837"
				y="-68.3194"
				width="140"
				height="140"
				rx="8"
				transform="rotate(-15 413.837 -68.3194)"
				fill="var(--theme--banner--art--foreground)"
			/>
			<rect
				x="419.385"
				y="261.482"
				width="460"
				height="60"
				rx="8"
				transform="rotate(-15 419.385 261.482)"
				fill="var(--theme--banner--art--foreground)"
			/>
			<rect
				x="475.953"
				y="163.503"
				width="300"
				height="60"
				rx="8"
				transform="rotate(-15 475.953 163.503)"
				fill="var(--theme--banner--art--foreground)"
			/>
			<rect
				x="-29.1021"
				y="133.188"
				width="460"
				height="60"
				rx="8"
				transform="rotate(-15 -29.1021 133.188)"
				fill="var(--theme--banner--art--foreground)"
			/>
			<rect
				x="398.679"
				y="184.208"
				width="60"
				height="60"
				rx="8"
				transform="rotate(-15 398.679 184.208)"
				fill="var(--theme--banner--art--foreground)"
			/>
			<rect
				x="336.563"
				y="-47.6139"
				width="60"
				height="60"
				rx="8"
				transform="rotate(-15 336.563 -47.6139)"
				fill="var(--theme--banner--art--foreground)"
			/>
			<rect
				x="377.974"
				y="106.934"
				width="220"
				height="60"
				rx="8"
				transform="rotate(-15 377.974 106.934)"
				fill="var(--theme--banner--art--foreground)"
			/>
			<rect
				x="-8.39648"
				y="210.462"
				width="380"
				height="220"
				rx="8"
				transform="rotate(-15 -8.39648 210.462)"
				fill="var(--theme--banner--art--foreground)"
			/>
			<rect
				x="63.3295"
				y="-140.045"
				width="220"
				height="220"
				rx="8"
				transform="rotate(-15 63.3295 -140.045)"
				fill="var(--theme--banner--art--foreground)"
			/>
			<rect
				x="764.344"
				y="3.4066"
				width="380"
				height="140"
				rx="8"
				transform="rotate(-15 764.344 3.4066)"
				fill="var(--theme--banner--art--foreground)"
			/>
		</svg>
	</div>
</template>

<style scoped>
.v-banner {
	container-type: inline-size;
	inline-size: 100%;
	padding: var(--theme--banner--padding);
	border-radius: var(--theme--banner--border-radius);
	background-color: var(--theme--banner--background);
	display: flex;
	align-items: center;
	gap: var(--theme--banner--padding);
	position: relative;
	overflow: hidden;

	.avatar {
		flex-shrink: 0;
		inline-size: 120px;
		block-size: 120px;
		position: relative;
		overflow: hidden;
		align-items: center;
		justify-content: center;
		border-radius: var(--theme--banner--avatar--border-radius);
		background-color: var(--theme--banner--avatar--background);
		color: var(--theme--banner--avatar--foreground);
		display: none;

		&.no-bg {
			background: transparent;
		}

		@container (width > 700px) {
			display: flex;
		}
	}

	.content {
		.headline {
			--theme--foreground: var(--theme--banner--foreground-subdued);
			color: var(--theme--banner--headline--foreground);
			font-family: var(--theme--banner--headline--font-family);
			font-weight: var(--theme--banner--headline--font-weight);
		}

		.title {
			--theme--foreground: var(--theme--banner--foreground);
			color: var(--theme--banner--title--foreground);
			font-family: var(--theme--banner--title--font-family);
			font-weight: var(--theme--banner--title--font-weight);
			font-size: 24px;
			line-height: 34px;
		}

		.subtitle {
			--theme--foreground: var(--theme--banner--foreground-subdued);
			color: var(--theme--banner--subtitle--foreground);
			font-family: var(--theme--banner--subtitle--font-family);
			font-weight: var(--theme--banner--subtitle--font-weight);
		}
	}

	.art {
		position: absolute;
		inset-block-start: 0;
		inset-inline-start: 0;
		min-block-size: 100%;
		min-inline-size: 100%;
		z-index: -1;
	}
}
</style>
