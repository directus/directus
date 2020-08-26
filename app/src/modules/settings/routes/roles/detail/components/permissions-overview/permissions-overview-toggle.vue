<template>
	<div class="permissions-overview-toggle">
		<v-menu show-arrow>
			<template #activator="{ toggle }">
				<v-icon @click="toggle" name="check" />
			</template>

			<v-list dense>
				<v-list-item>
					<v-list-item-icon>
						<v-icon name="check" />
					</v-list-item-icon>
					<v-list-item-content>
						{{ $t('all_access') }}
					</v-list-item-content>
				</v-list-item>

				<v-list-item>
					<v-list-item-icon>
						<v-icon name="block" />
					</v-list-item-icon>
					<v-list-item-content>
						{{ $t('no_access') }}
					</v-list-item-content>
				</v-list-item>

				<v-divider />

				<v-list-item>
					<v-list-item-icon>
						<v-icon name="rule" />
					</v-list-item-icon>
					<v-list-item-content>
						{{ $t('use_custom') }}
					</v-list-item-content>
					<v-list-item-icon>
						<v-icon name="launch" />
					</v-list-item-icon>
				</v-list-item>
			</v-list>
		</v-menu>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
import { Collection } from '@/types';

export default defineComponent({
	props: {
		collection: {
			type: Object as PropType<Collection>,
			required: true,
		},
		role: {
			type: String,
			required: true,
		},
		action: {
			type: String,
			required: true,
		},
	},
});
</script>

<style lang="scss" scoped>
.permissions-overview-toggle {
	--v-icon-color: var(--success);

	position: relative;
}
</style>
