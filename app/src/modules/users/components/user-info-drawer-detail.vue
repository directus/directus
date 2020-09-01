<template>
	<drawer-detail icon="info_outline" :title="$t('information')" close>
		<dl v-if="isNew === false && user">
			<div v-if="user.id">
				<dt>{{ $t('key') }}</dt>
				<dd>{{ user.id }}</dd>
			</div>
			<div v-if="user.last_page">
				<dt>{{ $t('last_page') }}</dt>
				<dd>
					<router-link :to="user.last_page">{{ user.last_page }}</router-link>
				</dd>
			</div>
			<div v-if="user.last_login">
				<dt>{{ $t('last_login') }}</dt>
				<dd>{{ user.last_login }}</dd>
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

		<v-divider />

		<div class="page-description" v-html="marked($t('page_help_users_detail'))" />
	</drawer-detail>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import marked from 'marked';

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
	setup(props) {
		return { marked };
	},
});
</script>

<style lang="scss" scoped>
.v-divider {
	margin: 20px 0;
}
</style>
