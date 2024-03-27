<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
	tabs: string[];
}>();

const activeTab = ref(props.tabs[0]);
</script>

<template>
	<div class="tabs">
		<div role="tablist" class="tab-buttons">
			<template v-for="tab in tabs" :key="tab">
				<button
					type="button"
					role="tab"
					:aria-selected="activeTab === tab"
					:class="{ active: activeTab === tab }"
					@click="activeTab = tab"
				>
					{{ tab }}
				</button>
			</template>
		</div>
		<div>
			<template v-for="tab in tabs" :key="tab">
				<div v-if="activeTab === tab" role="tabpanel" class="tab-content">
					<slot :name="tab.toLowerCase().replaceAll(' ', '-')" />
				</div>
			</template>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.tab-buttons {
	display: flex;
	justify-content: center;
	max-width: 560px;
	margin-inline: auto;
	padding: 12px;
	box-shadow: 0 5px 10px 0 rgba(23, 41, 64, 0.1);
	border-radius: 2em;
	width: 100%;

	button {
		color: var(--vp-c-text-2);
		cursor: pointer;
		border: none;
		font-size: 18px;
		font-weight: bold;
		width: 100%;
		padding: 12px;

		&:hover {
			color: var(--vp-c-text-1);
		}

		&.active {
			background: var(--vp-c-brand-darkest);
			color: white;
			border-radius: 10em;
			width: 100%;
		}
	}
}

.tab-content {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 24px;
	padding-top: 30px;
}

@media only screen and (max-width: 1200px) {
	.tab-content {
		grid-template-columns: 1fr 1fr;
	}
}

@media only screen and (max-width: 768px) {
	.tab-content {
		grid-template-columns: 1fr;
	}
	.tab-buttons button {
		font-size: 16px;
	}
}
</style>
