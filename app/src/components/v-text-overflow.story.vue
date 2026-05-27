<script setup lang="ts">
import VTextOverflow from './v-text-overflow.vue';

function initState() {
	return {
		text: 'This text should not wrap to a new line!',
		placement: 'bottom',
	};
}
</script>

<template>
	<Story title="VTextOverflow" :init-state="initState">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<VTextOverflow v-bind="state" />
		</template>
	</Story>
</template>
