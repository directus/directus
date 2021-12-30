<template>
	<sidebar-detail icon="info_outline" :title="t('information')" close>
		<template v-if="!isNew && role">
			<dl>
				<div>
					<dt>{{ t('primary_key') }}</dt>
					<dd>{{ role.id }}</dd>
				</div>
			</dl>

			<v-divider />
		</template>
		<div v-md="t('page_help_settings_roles_item')" class="page-description" />
	</sidebar-detail>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType } from 'vue';

export default defineComponent({
	props: {
		isNew: {
			type: Boolean,
			default: false,
		},
		role: {
			type: Object as PropType<any>,
			default: null,
		},
	},
	setup() {
		const { t } = useI18n();

		return { t };
	},
});
</script>

<style lang="scss" scoped>
.v-divider {
	margin: 20px 0;
}
</style>
