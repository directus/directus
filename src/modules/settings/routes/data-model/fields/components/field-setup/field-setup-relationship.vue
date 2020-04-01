<template>
	<v-tab-item value="relationship">
		<h2 class="title" v-if="isNew">{{ $t('relationship_setup_title') }}</h2>
		<!-- <v-fancy-select :items="items" v-model="_interface" /> -->

		<transition-expand>
			relationship
		</transition-expand>
	</v-tab-item>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
	props: {
		isNew: {
			type: Boolean,
			default: false,
		},
	},
	setup() {
		return {};
	},
});
</script>

<style lang="scss" scoped>
.v-fancy-select {
	margin-bottom: 48px;
}
</style>
