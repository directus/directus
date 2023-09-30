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

<style scoped>
.tab-buttons {
	display: flex;
	justify-content: center;
	max-width: 560px;
	margin-inline: auto;
	padding: 12px;
	box-shadow: 0 5px 10px 0 rgba(23, 41, 64, 0.1);
	border-radius: 8px;
	width: 100%;
}

.tab-buttons button {
	color: var(--vp-c-text-1);
	cursor: pointer;
	border: none;
	font-size: 18px;
	font-weight: bold;
	width: 100%;
	padding: 12px;
}

.tab-buttons button.active {
	background: var(--vp-c-purple-dimm-3);
	border-radius: 6px;
	width: 100%;
}

.tab-content {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 24px;
	padding-top: 60px;
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
