<template>
	<v-info center :title="$t('no_app_access')" type="danger" icon="block">
		{{ $t('no_app_access_copy') }}

		<template #append>
			<v-button to="/logout">{{ $t('switch_user') }}</v-button>
		</template>
	</v-info>
</template>
