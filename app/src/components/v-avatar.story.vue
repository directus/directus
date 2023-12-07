<script setup lang="ts">
import VAvatar from './v-avatar.vue';
</script>

<template>
	<Story title="VAvatar">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<v-avatar v-bind="state">
				<v-icon name="person" />
			</v-avatar>
		</template>
	</Story>
</template>
