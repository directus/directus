<script setup lang="ts">
import { Collection } from '@directus/types';
import { orderBy } from 'lodash';
import { computed, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { syncFieldDetailStoreProperty, useFieldDetailStore } from '../store/';
import FieldConfiguration from './field-configuration.vue';
import TransitionExpand from '@/components/transition/expand.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import { useExtensions } from '@/extensions';

const props = withDefaults(
	defineProps<{
		collection: Collection;
		search?: string | null;
	}>(),
	{
		search: null,
	},
);

defineEmits<{
	(e: 'save'): void;
	(e: 'toggleAdvanced'): void;
}>();

const { collection, search } = toRefs(props);

const { t } = useI18n();

const fieldDetail = useFieldDetailStore();
watch(collection, () => fieldDetail.update({ collection: collection.value.collection }), { immediate: true });

const { interfaces } = useExtensions();

const interfacesSorted = computed(() => {
	return orderBy(
		interfaces.value.filter((inter) => !inter.system),
		['order'],
	);
});

const groups = computed(() => {
	const groupsWithInterfaces = [
		{
			key: 'standard',
			name: t('interface_group_text_and_numbers'),
			interfaces: filterInterfacesByGroup('standard'),
		},
		{
			key: 'selection',
			name: t('interface_group_selection'),
			interfaces: filterInterfacesByGroup('selection'),
		},
		{
			key: 'relational',
			name: t('interface_group_relational'),
			interfaces: filterInterfacesByGroup('relational'),
		},
		{
			key: 'presentation',
			name: t('interface_group_presentation'),
			interfaces: filterInterfacesByGroup('presentation'),
		},
		{
			key: 'group',
			name: t('interface_group_groups'),
			interfaces: filterInterfacesByGroup('group'),
		},
		{
			key: 'other',
			name: t('interface_group_other'),
			interfaces: filterInterfacesByGroup('other'),
		},
	];

	if (!search.value) return groupsWithInterfaces;

	return groupsWithInterfaces.filter((group) => group.interfaces.length > 0);

	function filterInterfacesByGroup(group: string) {
		const filteredInterfaces = interfacesSorted.value.filter((inter) => (inter.group ?? 'other') === group);
		if (!search.value) return filteredInterfaces;
		const searchValue = search.value!.toLowerCase();
		return filteredInterfaces.filter(
			(inter) => inter.id.toLowerCase().includes(searchValue) || inter.name.toLowerCase().includes(searchValue),
		);
	}
});

const chosenInterface = syncFieldDetailStoreProperty('field.meta.interface');

const configRow = computed(() => {
	if (!chosenInterface.value) return null;

	let indexInGroup: number | null = null;

	groups.value.forEach((group) => {
		const index = group.interfaces.findIndex((inter) => inter.id === chosenInterface.value);
		if (index !== -1) indexInGroup = index;
	});

	if (indexInGroup === null) return null;

	const windowWidth = window.innerWidth;

	let columns = 1;

	if (windowWidth > 400) {
		columns = 2;
	}

	if (windowWidth > 600) {
		columns = 3;
	}

	if (windowWidth > 840) {
		columns = 4;
	}

	return Math.ceil((indexInGroup + 1) / columns) + 1;
});

function isSVG(path: string) {
	return path.startsWith('<svg');
}

function toggleInterface(id: string) {
	if (chosenInterface.value === id) {
		chosenInterface.value = null;
	} else {
		chosenInterface.value = id;
	}
}
</script>

<template>
	<div class="content">
		<div v-for="group of groups" :key="group.key" class="group">
			<h2>{{ group.name }}</h2>

			<div class="grid">
				<button
					v-for="inter of group.interfaces"
					:key="inter.id"
					class="interface"
					:class="{ active: chosenInterface === inter.id, gray: chosenInterface && chosenInterface !== inter.id }"
					@click="toggleInterface(inter.id)"
				>
					<div class="preview">
						<template v-if="inter.preview">
							<!-- eslint-disable-next-line vue/no-v-html -->
							<span v-if="isSVG(inter.preview)" class="svg" v-html="inter.preview" />
							<img v-else :src="inter.preview" alt="" />
						</template>

						<span v-else class="fallback">
							<VIcon large :name="inter.icon" />
						</span>
					</div>
					<VTextOverflow :text="inter.name" class="name" />
				</button>

				<TransitionExpand>
					<FieldConfiguration
						v-if="chosenInterface && !!group.interfaces.some((inter) => inter.id === chosenInterface)"
						:row="configRow"
						@save="$emit('save')"
						@toggle-advanced="$emit('toggleAdvanced')"
					/>
				</TransitionExpand>
			</div>
		</div>
	</div>
</template>

<style scoped lang="scss">
.content {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding-bottom);
}

.group h2 {
	margin-block-end: 40px;
	padding-block-end: 2px;
	font-weight: 700;
	border-block-end: var(--theme--border-width) solid var(--theme--border-color-subdued);
}

.group + .group {
	margin-block-start: 80px;
}

.grid {
	--columns: 1;

	display: grid;
	grid-template-columns: repeat(var(--columns), 1fr);
	gap: 32px;

	@media (min-width: 400px) {
		--columns: 2;
	}

	@media (width > 640px) {
		--columns: 3;
	}

	@media (min-width: 840px) {
		--columns: 4;
	}
}

.interface {
	min-block-size: 100px;
	overflow: hidden;
	text-align: start;
}

.preview {
	--v-icon-color: var(--theme--background);

	display: flex;
	align-items: center;
	justify-content: center;
	inline-size: 160px;
	block-size: 100px;
	margin-block-end: 8px;
	border: var(--theme--border-width) solid var(--theme--border-color-subdued);
	border-radius: var(--theme--border-radius);
	transition: var(--fast) var(--transition);
	transition-property: background-color, border-color;
}

.preview img {
	inline-size: 100%;
	block-size: 100%;
	object-fit: cover;
}

.preview .svg {
	display: contents;
}

.preview :deep(svg) {
	inline-size: 100%;
	block-size: 100%;
}

.preview :deep(svg) .glow {
	filter: drop-shadow(0 0 4px var(--theme--primary-subdued));
}

.preview .fallback {
	--v-icon-color: var(--theme--primary-subdued);

	display: block;
	padding: 8px 16px;
	background-color: var(--theme--background);
	border: var(--theme--border-width) solid var(--theme--primary);
	border-radius: var(--theme--border-radius);
	box-shadow: 0 0 8px var(--theme--primary-subdued);
}

.interface:hover .preview {
	border-color: var(--theme--form--field--input--border-color);
}

.interface.active .preview {
	background-color: var(--theme--primary-background);
	border-color: var(--theme--primary);
}

.interface.gray .preview {
	--primary: var(--theme--foreground-subdued);
	--primary-50: var(--theme--foreground-subdued);

	background-color: var(--theme--background-subdued);
}

.interface.gray .preview .fallback {
	--v-icon-color: var(--theme--foreground-subdued);

	box-shadow: 0 0 8px var(--theme--foreground-subdued);
}
</style>
