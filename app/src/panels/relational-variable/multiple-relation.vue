<script setup lang="ts">
import { computed, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import useDisplayItems from './use-display-items';

interface Props {
	value: (string | number)[];
	collection: string;
	template: string;
	filter: Record<string, any>;
	limit: number;
}
const props = withDefaults(defineProps<Props>(), { limit: 5 });
const emit = defineEmits(['input', 'select']);

const { t } = useI18n();
const { collection, template, value } = toRefs(props);

const { displayItems, displayTemplate, loading, primaryKey } = useDisplayItems(collection, template, value);
const totalItemCount = computed(() => displayItems.value?.length || 0);

function deleteItem(elem: Record<string, any>) {
	emit(
		'input',
		displayItems.value
			.filter((item) => item[primaryKey.value] !== elem[primaryKey.value])
			.map((item) => item[primaryKey.value]),
	);
}
</script>

<template>
	<div class="one-to-many">
		<template v-if="loading">
			<v-skeleton-loader v-for="n in limit" :key="n" type="block-list-item-dense" />
		</template>

		<v-notice v-else-if="displayItems.length === 0">
			{{ t('no_items') }}
		</v-notice>

		<v-list v-else>
			<v-list-item v-for="element in displayItems" :key="element[primaryKey]" block :dense="displayItems.length > 4">
				<render-template :collection="collection" :item="element" :template="displayTemplate" />
				<div class="spacer" />
				<v-icon v-tooltip="t('remove_item')" class="deselect" name="delete" @click.stop="deleteItem(element)" />
			</v-list-item>
		</v-list>

		<div class="actions list">
			<button v-if="totalItemCount < limit" @click="$emit('select')">
				{{ t('add_existing') }}
			</button>
			<button v-if="totalItemCount > 0" @click="$emit('input', undefined)">
				{{ t('clear_items') }}
			</button>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.one-to-many {
	height: 100%;
	display: flex;
	flex-direction: column;
}
.v-list {
	margin-top: 8px;
	flex-grow: 1;
	--v-list-padding: 0 0 4px;

	.v-list-item.deleted {
		--v-list-item-border-color: var(--danger-25);
		--v-list-item-border-color-hover: var(--danger-50);
		--v-list-item-background-color: var(--danger-10);
		--v-list-item-background-color-hover: var(--danger-25);

		::v-deep(.v-icon) {
			color: var(--danger-75);
		}
	}
}

.v-skeleton-loader,
.v-notice {
	margin-top: 8px;
}

.actions {
	display: flex;
	align-items: center;
	gap: 8px;

	button {
		color: var(--theme--primary);
		padding: 0 4px;

		&:hover {
			color: var(--theme--primary-accent);
		}
	}
}

.deselect {
	--v-icon-color: var(--theme--foreground-subdued);
	transition: color var(--fast) var(--transition);
	margin: 0 4px;

	&:hover {
		--v-icon-color: var(--theme--danger);
	}
}
</style>
