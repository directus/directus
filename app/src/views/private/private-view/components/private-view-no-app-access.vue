<script setup lang="ts">
import VButton from '@/components/v-button.vue';
import VInfo from '@/components/v-info.vue';
</script>

<template>
	<VInfo center :title="$t('no_app_access')" type="danger" icon="block">
		{{ $t('no_app_access_copy') }}

		<template #append>
			<VButton to="/logout">{{ $t('switch_user') }}</VButton>
		</template>
	</VInfo>
</template>
