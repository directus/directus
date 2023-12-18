<script setup lang="ts">
import { ref } from 'vue';
import TransitionDialog from './dialog.vue';

const show = ref(true);
</script>

<template>
	<Story title="Transition/TransitionDialog">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<transition-dialog v-bind="state">
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
					This is inside transition dialog.
				</div>
			</transition-dialog>
		</template>

		<template #controls>
			<HstCheckbox v-model="show" title="Toggle" />
		</template>
	</Story>
</template>
