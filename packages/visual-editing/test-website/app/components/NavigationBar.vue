<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRuntimeConfig } from '#app';
import { Menu, ChevronDown } from 'lucide-vue-next';
import SearchModal from '~/components/base/SearchModel.vue';
import { apply, setAttr } from '@directus/visual-editing';

interface NavigationItem {
	id: string;
	title: string;
	url?: string;
	page?: { permalink: string };
	children?: NavigationItem[];
}

interface Navigation {
	items: NavigationItem[];
}

interface Globals {
	id: string;
	logo?: string;
	logo_dark_mode?: string;
}

const props = defineProps<{
	navigation: Navigation;
	globals: Globals;
}>();

const menuOpen = ref(false);
const runtimeConfig = useRuntimeConfig();

const lightLogoUrl = computed(() =>
	props.globals?.logo ? `${runtimeConfig.public.directusUrl}/assets/${props.globals.logo}` : '/images/logo.svg',
);

const darkLogoUrl = computed(() =>
	props.globals?.logo_dark_mode ? `${runtimeConfig.public.directusUrl}/assets/${props.globals.logo_dark_mode}` : '',
);

const handleLinkClick = () => {
	menuOpen.value = false;
};

const refresh = inject<() => void>('refreshSiteData');
const headerEl = useTemplateRef('header');

(function useVisualEditingTest() {
	if (!import.meta.client) return;

	const {
		public: { visualEditingTestEnv, testCase, directusUrl },
	} = useRuntimeConfig();

	if (!visualEditingTestEnv) return;

	const customClass = 'header-z-index';

	if (testCase === 'basic' || testCase === 'methods') {
		useRuntimeHook('page:finish', () => {
			apply({
				directusUrl,
				elements: headerEl.value,
				customClass,
			});
		});
	}

	if (testCase === 'refresh-all') {
		useRuntimeHook('page:finish', () => {
			apply({
				directusUrl,
				elements: headerEl.value,
				customClass,
				onSaved: () => refreshNuxtData(),
			});
		});
	}

	if (testCase === 'refresh') {
		useRuntimeHook('page:finish', () => {
			apply({ directusUrl, elements: headerEl.value, customClass, onSaved: refresh });
		});
	}

	if (testCase === 'refresh-customized') {
		useRuntimeHook('page:finish', () => {
			apply({ directusUrl, elements: headerEl.value, onSaved: refresh, customClass: 'my-custom-header' });
		});
	}
})();
</script>

<template>
	<header ref="header" class="sticky top-0 z-50 w-full bg-background text-foreground">
		<Container class="flex items-center justify-between p-4">
			<NuxtLink
				to="/"
				class="flex-shrink-0"
				:data-directus="
					setAttr({
						collection: 'globals',
						item: globals.id,
						fields: ['logo', 'logo_dark_mode'],
						mode: 'popover',
					})
				"
			>
				<img :src="lightLogoUrl" alt="Logo" class="w-[120px] h-auto dark:hidden" width="150" height="100" />
				<img
					v-if="darkLogoUrl"
					:src="darkLogoUrl"
					alt="Logo (Dark Mode)"
					class="w-[120px] h-auto hidden dark:block"
					width="150"
					height="100"
				/>
			</NuxtLink>

			<nav class="flex items-center gap-4">
				<SearchModal />
				<NavigationMenu class="hidden md:flex">
					<NavigationMenuList class="flex gap-6">
						<NavigationMenuItem v-for="section in props.navigation.items" :key="section.id">
							<template v-if="section.children?.length">
								<NavigationMenuTrigger
									class="focus:outline-none font-heading !text-nav hover:bg-background hover:text-accent"
								>
									{{ section.title }}
								</NavigationMenuTrigger>
								<NavigationMenuContent class="min-w-[200px] rounded-md bg-background p-4 shadow-md">
									<ul class="min-h-[100px] flex flex-col gap-2">
										<li v-for="child in section.children" :key="child.id">
											<NavigationMenuLink
												ref="nav"
												:href="child.page?.permalink || child.url || '#'"
												class="font-heading text-nav p-2"
											>
												{{ child.title }}
											</NavigationMenuLink>
										</li>
									</ul>
								</NavigationMenuContent>
							</template>

							<NavigationMenuLink
								v-else
								:href="section.page?.permalink || section.url || '#'"
								class="font-heading text-nav"
							>
								{{ section.title }}
							</NavigationMenuLink>
						</NavigationMenuItem>
					</NavigationMenuList>
				</NavigationMenu>

				<div class="flex md:hidden">
					<DropdownMenu v-model:open="menuOpen">
						<DropdownMenuTrigger as-child>
							<Button
								variant="link"
								size="icon"
								aria-label="Open menu"
								class="text-black dark:text-white dark:hover:text-accent"
							>
								<Menu />
							</Button>
						</DropdownMenuTrigger>

						<DropdownMenuContent
							align="start"
							class="top-full w-screen p-6 shadow-md max-w-full overflow-hidden bg-background"
						>
							<div class="flex flex-col gap-4">
								<div v-for="section in props.navigation.items" :key="section.id">
									<Collapsible v-if="section.children?.length">
										<CollapsibleTrigger
											class="font-heading text-nav hover:text-accent w-full text-left flex items-center focus:outline-none"
										>
											<span>{{ section.title }}</span>
											<ChevronDown class="size-4 ml-1 hover:rotate-180 active:rotate-180 focus:rotate-180" />
										</CollapsibleTrigger>
										<CollapsibleContent class="ml-4 mt-2 flex flex-col gap-2">
											<NuxtLink
												v-for="child in section.children"
												:key="child.id"
												:to="child.page?.permalink || child.url || '#'"
												class="font-heading text-nav"
												@click="handleLinkClick"
											>
												{{ child.title }}
											</NuxtLink>
										</CollapsibleContent>
									</Collapsible>

									<NuxtLink
										v-else
										:to="section.page?.permalink || section.url || '#'"
										class="font-heading text-nav"
										@click="handleLinkClick"
									>
										{{ section.title }}
									</NuxtLink>
								</div>
							</div>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				<ThemeToggle />
			</nav>
		</Container>
	</header>
</template>

<style>
.header-z-index {
	--directus-visual-editing--overlay--z-index: 99;
}

.my-custom-header {
	--directus-visual-editing--overlay--z-index: 99;
	--directus-visual-editing--rect--border-spacing: 14px;
	--directus-visual-editing--rect--border-width: 5px;
	--directus-visual-editing--rect--border-color: lightgreen;
	--directus-visual-editing--rect--border-radius: 20px;
	--directus-visual-editing--rect-visible--opacity: 0.5;
	--directus-visual-editing--edit-btn--width: 30px;
	--directus-visual-editing--edit-btn--height: 20px;
	--directus-visual-editing--edit-btn--radius: 2px;
	--directus-visual-editing--edit-btn--bg-color: lightgreen;
	--directus-visual-editing--edit-btn--icon-bg-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="%230000ff"><path d="M240-120q-45 0-89-22t-71-58q26 0 53-20.5t27-59.5q0-50 35-85t85-35q50 0 85 35t35 85q0 66-47 113t-113 47Zm0-80q33 0 56.5-23.5T320-280q0-17-11.5-28.5T280-320q-17 0-28.5 11.5T240-280q0 23-5.5 42T220-202q5 2 10 2h10Zm230-160L360-470l358-358q11-11 27.5-11.5T774-828l54 54q12 12 12 28t-12 28L470-360Zm-190 80Z"/></svg>');
	--directus-visual-editing--edit-btn--icon-bg-size: contain;
}

.my-custom-header .directus-visual-editing-rect-inner {
	border-style: dotted;
}
</style>
