<template>
	<drawer-detail icon="info_outline" :title="$t('information')" close>
		<dl v-if="isNew === false">
			<div v-if="user.id">
				<dt>{{ $t('primary_key') }}</dt>
				<dd>{{ user.id }}</dd>
			</div>
			<div v-if="user.external_id">
				<dt>{{ $t('external_id') }}</dt>
				<dd>{{ user.external_id }}</dd>
			</div>
			<div v-if="user.last_page">
				<dt>{{ $t('last_page') }}</dt>
				<dd>
					<router-link :to="user.last_page">{{ user.last_page }}</router-link>
				</dd>
			</div>
			<div v-if="user.last_access_on">
				<dt>{{ $t('last_login') }}</dt>
				<dd>{{ user.last_access_on }}</dd>
			</div>
			<div v-if="user.created_on">
				<dt>{{ $t('created_on') }}</dt>
				<dd>{{ user.created_on }}</dd>
			</div>
			<div v-if="user.created_by">
				<dt>{{ $t('created_by') }}</dt>
				<dd>{{ user.created_by }}</dd>
			</div>
			<div v-if="user.modified_on">
				<dt>{{ $t('modified_on') }}</dt>
				<dd>{{ user.modified_on }}</dd>
			</div>
		</dl>

		<template v-else>
			--
		</template>
	</drawer-detail>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
	props: {
		user: {
			type: Object,
			default: null,
		},
		isNew: {
			type: Boolean,
			default: false,
		},
	},
});
</script>

<style lang="scss" scoped>
dl > div {
	display: flex;
	margin-bottom: 12px;
}

dt,
dd {
	display: inline-block;
}

dt {
	margin-right: 8px;
	font-weight: 600;
}

dd {
	flex-grow: 1;
	overflow: hidden;
	color: var(--foreground-subdued);
	white-space: nowrap;
	text-overflow: ellipsis;
}

dd a {
	color: var(--primary);
}
</style>
