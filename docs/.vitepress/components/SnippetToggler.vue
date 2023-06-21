<script lang="ts" setup>
import { ref } from 'vue';

const props = defineProps<{
	choices: string[];
	label?: string;
}>();

const pref = ref(props.choices[0]);

const onPrefChange = (event: Event) => {
	pref.value = (event.target as HTMLSelectElement).value;
};
</script>

<template>
	<div class="snippet-toggler">
		<div class="snippet-toggler-header">
			<span class="snippet-toggler-header-label">{{ label }}</span>

			<span class="spacer" />

			<div class="snippet-toggler-header-lang-container">
				<select class="snippet-toggler-header-lang" :value="pref" @change="onPrefChange">
					<option v-for="choice in choices" :value="choice">
						{{ choice }}
					</option>
				</select>
				<svg
					class="snippet-toggler-header-lang-arrow"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 48 48"
					height="18"
					width="18"
				>
					<path d="m24 30.75-12-12 2.15-2.15L24 26.5l9.85-9.85L36 18.8Z" />
				</svg>
			</div>
		</div>

		<div class="content-area">
			<template v-for="choice in choices">
				<div v-if="choice === pref">
					<slot :name="choice.toLowerCase()"></slot>
				</div>
			</template>
		</div>
	</div>
</template>

<style scoped>
.snippet-toggler {
	overflow: hidden;
	background: linear-gradient(172.36deg, rgba(228, 234, 241, 0.1) -5.49%, rgba(228, 234, 241, 0) 123.05%);
}
.snippet-toggler-header {
	background: linear-gradient(172.36deg, rgba(228, 234, 241, 0.1) -5.49%, rgba(228, 234, 241, 0) 123.05%);
	color: #a6accd;
	border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	height: 40px;
	display: flex;
	align-items: center;
	padding: 0 24px;
}
.spacer {
	flex-grow: 1;
}
.snippet-toggler-header-label {
	text-transform: uppercase;
	font-size: 12px;
	font-weight: 600;
}

.snippet-toggler-header-lang-container {
	display: flex;
	align-items: center;
	gap: 2px;
}
.snippet-toggler-header-lang {
	background-color: transparent;
	text-align: right;
	border: 0;
	padding: 0;
	border: 0;
	border-color: transparent;
	font-family: inherit;
	color: inherit;
	appearance: none;
	line-height: inherit;
	color: inherit;
	font-size: 12px;
}
.snippet-toggler-header-lang:focus {
	outline: none;
}
.snippet-toggler-header-lang-arrow {
	fill: #a6accd;
	user-select: none;
	pointer-events: none;
}

.snippet-toggler .content-area [class^='language-'] {
	margin: 0;
	border-radius: 0;
	display: none;
}

.snippet-toggler .content-area :global(.lang) {
	display: none;
}

@media (min-width: 640px) {
	.snippet-toggler {
		border-radius: 16px;
	}
}
.content-area {
	padding-inline: 24px;
	padding-bottom: 32px;
	scrollbar-width: none;
	overflow-y: auto;
}
</style>
