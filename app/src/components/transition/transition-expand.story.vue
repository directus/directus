<script setup lang="ts">
import { ref } from 'vue';
import TransitionExpand from './expand.vue';

const show = ref(true);
</script>

<template>
	<Story title="Transition/TransitionExpand">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<transition-expand v-bind="state">
				<div
					v-if="show"
					style="
						background-color: var(--theme--background-normal);
						height: 200px;
						width: 400px;
						display: flex;
						justify-content: center;
						align-items: center;
					"
				>
					This is inside transition expand.
				</div>
			</transition-expand>
		</template>

		<template #controls>
			<HstCheckbox v-model="show" title="Toggle" />
		</template>
	</Story>
</template>
