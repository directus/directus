<template>
	<div v-if="loading" class="extensions" :class="{ list: !grid, grid }">
		<v-skeleton-loader v-for="i in limit" :key="i" type="block-list-item" />
	</div>
	<table v-else-if="!grid" class="extensions list">
		<tbody>
			<tr
				v-for="extension in extensions"
				:key="extension.id"
				tag="tr"
				class="extension"
				@click="push((app ? '/settings/market/extensions/' : '/extensions/') + extension.id)"
			>
				<td class="icon">
					<div class="box">
						<img v-if="extension.icon?.startsWith('img:')" :src="extension.icon.substring(4)" />
						<v-icon v-else :name="extension.icon ? extension.icon : 'extension'" />
					</div>
					<v-badge
						v-if="extension.installed"
						bordered
						icon="check"
						class="app-badge"
						:class="{ enabled: extension.enabled }"
					/>
				</td>
				<td class="content">
					<RouterLink class="title" :to="(app ? '/settings/market/extensions/' : '/extensions/') + extension.id">
						{{ formatTitle(extension.id) }}
					</RouterLink>
					<div class="description">{{ extension.description }}</div>
				</td>
				<td class="stats">
					<div>
						<div v-tooltip="'Downloads last Month'" class="stat downloads">
							{{ extension.downloads_last_month ? formatNumber(extension.downloads_last_month) : '--' }}
							<v-icon name="save_alt" />
						</div>
						<div v-tooltip="'Last updated'" class="stat last-updated">
							{{ extension.updated ? formatDate(extension.updated) : '--' }}
							<v-icon name="update" />
						</div>
					</div>
				</td>
			</tr>
		</tbody>
	</table>
	<div v-else class="extensions grid">
		<RouterLink
			v-for="extension in extensions"
			:key="extension.id"
			:to="(app ? '/settings/market/extensions/' : '/extensions/') + extension.id"
			class="extension"
		>
			<div class="icon">
				<div class="box">
					<img v-if="extension.icon?.startsWith('img:')" :src="extension.icon.substring(4)" />
					<v-icon v-else :name="extension.icon ? extension.icon : 'extension'" />
				</div>
				<v-badge
					v-if="extension.installed"
					bordered
					icon="check"
					class="app-badge"
					:class="{ enabled: extension.enabled }"
				/>
			</div>
			<div class="content">
				<div class="title">{{ formatTitle(extension.id) }}</div>
				<div class="description">{{ extension.description }}</div>
				<div class="stats">
					<div v-tooltip="'Downloads last Month'" class="stat downloads">
						{{ extension.downloads_last_month ? formatNumber(extension.downloads_last_month) : '--' }}
						<v-icon name="save_alt" />
					</div>
					<div v-tooltip="'Last updated'" class="stat last-updated">
						{{ extension.updated ? formatDate(extension.updated) : '--' }}
						<v-icon name="update" />
					</div>
					<div v-if="extension.author?.name" class="stat author">
						by
						<RouterLink :to="(app ? '/settings/market/users/' : '/users/') + extension.author.email">
							{{ extension.author.name }}
						</RouterLink>
					</div>
				</div>
			</div>
		</RouterLink>
	</div>
	<v-pagination
		v-if="extensionCount > limit"
		v-model="page"
		:length="Math.ceil(extensionCount / limit)"
		:total-visible="5"
	/>
</template>

<script setup lang="ts">
import type { Filter } from '@directus/types';
import type { AxiosInstance } from 'axios';
import { useRouter } from 'vue-router';
import { inject, ref, watch, computed } from 'vue';
import { formatTitle, formatNumber, formatDate } from '@directus/utils/browser';
import type { ExtensionInfo } from '@directus/types';
import { isEqual, sortBy } from 'lodash-es';

export type Query = {
	search?: string | undefined;
	filter?: Filter;
	fields?: string;
	page?: number;
	limit?: number;
	sort?: string;
};

interface Props {
	type: string;
	query?: Query | undefined;
	app?: boolean | undefined;
	grid?: boolean | undefined;
	existingExtensions?: ExtensionInfo[] | undefined;
}

export interface Extension {
	id: string;
	icon?: string;
	description?: string;
	latest_version?: {
		types?: {
			extension_types_type?: string;
		};
	};
	author?: {
		name?: string;
		email?: string;
	};
	updated?: string;
	downloads_last_month?: number;
	registry?: string;
	enabled?: boolean;
	installed?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	query: () => ({}),
	app: false,
	grid: false,
});

const _extensions = ref<Extension[]>([]);

const extensions = computed({
	get() {
		if (props.type === 'installed') {
			const reverse = query.value.sort?.startsWith('-') ?? false;
			const sort = reverse ? query.value.sort?.substring(1) : query.value.sort;

			const sorted = sortBy(_extensions.value, [sort]) as Extension[];

			return reverse ? sorted.reverse() : sorted;
		}

		return _extensions.value;
	},
	set(newValue) {
		_extensions.value = newValue;
	},
});

const api = inject('api') as AxiosInstance;

const { push } = useRouter();
const extensionCount = ref(0);
const page = ref(1);
const limit = ref(12);
const loading = ref(false);

const query = computed<Query>(() => {
	const query: Query = { ...props.query };

	query.fields =
		(query.fields ? query.fields + ',' : '') +
		'id,icon,description,latest_version.types.extension_types_type,author.name,author.email,updated,downloads_last_month,registry';

	const filterList: Record<string, any>[] = [];

	if (props.type === 'installed') {
		filterList.push({
			id: {
				_in: props.existingExtensions?.map((ext) => ext.name) || [],
			},
		});
	} else if (props.type !== 'all') {
		filterList.push({
			latest_version: {
				types: {
					extension_types_type: {
						_contains: props.type,
					},
				},
			},
		});
	}

	if (props.query.filter) filterList.push(props.query.filter);

	query.filter = {
		_and: filterList,
	};

	if (props.query.sort === undefined) query.sort = '-downloads_last_year';

	query.limit = limit.value;
	query.page = page.value;

	if (props.query.search) query.search = props.query.search;

	return query;
});

watch(
	query,
	(newQuery, oldQuery) => {
		if (
			isEqual(newQuery.filter, oldQuery?.filter) === false ||
			newQuery.search !== oldQuery?.search ||
			newQuery.sort !== oldQuery?.sort
		) {
			page.value = 1;
		}

		loadExtensions();
	},
	{ deep: true, immediate: true }
);

async function loadExtensions() {
	if (loading.value) return;
	loading.value = true;

	const response = await api.get('/items/extensions', {
		params: query.value,
	});

	if (props.type === 'installed') {
		extensions.value = (props.existingExtensions ?? []).map((existingExtension) => {
			const extension = response.data.data.find((extension: any) => extension.id === existingExtension.name);

			return {
				...(extension ?? {}),
				id: existingExtension.name,
				enabled: existingExtension.enabled,
				installed: true,
			};
		});

		extensionCount.value = extensions.value.length;
	} else {
		extensions.value = response.data.data.map((extension: any) => {
			const existing = props.existingExtensions?.find((ext) => ext.name === extension.id);

			if (existing) {
				return {
					...extension,
					enabled: existing.enabled,
					installed: true,
				};
			}

			return extension;
		});

		const countResponse = await api.get('/items/extensions', {
			params: {
				filter: query.value.filter,
				search: query.value.search,
				aggregate: {
					countDistinct: 'id',
				},
			},
		});

		extensionCount.value = countResponse.data.data[0].countDistinct.id;
	}

	loading.value = false;
}
</script>

<style lang="scss" scoped>
.extension {
	cursor: pointer;
	text-decoration: none;

	&:hover td {
		background-color: var(--background-subdued);
		--v-badge-border-color: var(--background-subdued);
	}

	.icon {
		width: min-content;
		height: min-content;

		.box {
			width: 60px;
			height: 60px;
			border-radius: 12px;
			background-color: var(--primary-10);
			color: var(--primary);
			display: grid;
			place-items: center;

			@media screen and (max-width: 600px) {
				width: 50px;
				height: 50px;
			}
		}

		.v-badge {
			display: block;
			--v-badge-background-color: var(--background-normal-alt);
			--v-badge-color: var(--foreground-normal-alt);
			--v-badge-offset-x: 6px;
			--v-badge-offset-y: -10px;

			&.enabled {
				--v-badge-background-color: var(--primary);
				--v-badge-color: var(--foreground-inverted);
			}
		}
	}

	.content {
		padding-left: 8px;

		.title {
			text-decoration: none;
			font-size: 16px;
			font-weight: 700;
			color: var(--foreground-normal);
		}
	}

	.description {
		color: var(--foreground-subdued);
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
		max-width: 100%;
	}

	.stats {
		display: flex;
		color: var(--foreground-subdued);

		> div:not(.stat) {
			display: flex;
			align-items: center;
			justify-content: flex-end;
			gap: 8px;
		}

		.stat {
			display: flex;
			align-items: center;
			justify-content: flex-end;
			gap: 4px;
		}

		.author a {
			color: var(--purple-90);
		}
	}
}
.extensions.list {
	table-layout: fixed;
	width: 100%;
	border-collapse: collapse;

	td {
		padding: 8px 8px;
	}

	td:first-child {
		border-radius: var(--border-radius) 0 0 var(--border-radius);
	}

	td:last-child {
		border-radius: 0 var(--border-radius) var(--border-radius) 0;
	}

	.v-skeleton-loader {
		height: 76px;
	}

	.extension {
		.stats {
			width: min-content;
			text-align: end;
			vertical-align: middle;

			.downloads {
				width: 70px;
			}

			.last-updated {
				width: 78px;
			}

			@media screen and (max-width: 600px) {
				> div {
					flex-direction: column;
					align-items: flex-end;
					gap: 4px;
				}
			}
		}
	}
}

.extensions.grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	grid-gap: 32px 16px;
	width: 100%;

	.v-skeleton-loader {
		height: 128px;
		margin-top: 0px;
	}

	.extension {
		.icon {
			margin-bottom: 10px;
		}

		.stats {
			display: flex;
			gap: 12px;
		}
	}
}

.v-pagination {
	margin-top: 16px;
}
</style>
