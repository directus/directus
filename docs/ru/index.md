---
layout: home
---

<script setup>
import Pattern from '../.vitepress/components/home/Pattern.vue';
import Footer from '../.vitepress/components/home/Footer.vue';
import Github from '../.vitepress/components/home/icons/Github.vue';
</script>

<section :class="[$style.hero, $style.paddingBox]">
	<div :class="$style.heroPattern">
		 <Pattern />
	</div>
	<div :class="[$style.sectionContainer, $style.sectionContainerHero, $style.flex]">
		<div :class="[$style.heroContent, $style.sectionPaddingHero]">
			<div :class="$style.heroBadge">Обучающие материалы</div>
			<h1>Документация Directus</h1>
			<p>Изучайте наши материалы и мощный механизм обработки данных, чтобы уверенно строить свои проекты.</p>
			<div :class="[$style.heroButtons, $style.buttonGroup]">
				<Button href="/ru/getting-started/quickstart">Начать</Button>
				<Button secondary :icon="Github" href="https://github.com/directus/directus/" external>GitHub</Button>
			</div>
		</div>
		<div :class="$style.heroToggler">

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API" :alwaysDark="true">
<template #rest>

```js
GET /items/products/4?
	fields[]=id,status,title,category,image.id,image.name
```

</template>
<template #graphql>

```graphql
query {
	articles_by_id(id: 4) {
		id
		status
		title
		category
		image {
			id
			name
		}
	}
}
```

</template>
<template #sdk>

```js
await directus.request(
  readItem('articles', 4, {
    fields: [
      'id',
      'status',
      'title',
      'category,',
      { image: ['id', 'name'] }
    ]
  })
);
```

</template>
</SnippetToggler>
		</div>
	</div>

</section>

<section :class="[$style.sectionPaddingLg, $style.paddingBox]">
	<Tabs :class="[$style.sectionContainer, $style.whiteBg]" :tabs="['Разработчикам', 'Пользователям']">
		<template #разработчикам>
			<Card
				title="API для базы данных"
				text="Используйте наши динамические REST API и GraphQL для доступа к данным и эффективного управления ими."
				url="/ru/reference/introduction"
				icon="api"
			/>
			<Card
				title="Модель данных"
				text="Структурируйте и упорядочивайте элементы коллекции, устанавливая взаимосвязи между ними."
				url="/ru/app/data-model"
				icon="database"
			/>
			<Card
				title="Аутентификация"
				text="Используйте наши простые, но мощные функции аутентификации в собственных приложениях."
				url="/ru/reference/authentication"
				icon="lock"
			/>
			<Card
				title="Расширения"
				text="Создавайте, изменяйте и расширяйте любые функции, необходимые для вашего проекта, с помощью наших гибких расширений."
				url="/ru/extensions/introduction"
				icon="extension"
			/>
			<Card
				title="Режим реального времени"
				text="Доступ к данным в БД вашего проекта в реальном времени с помощью WebSocket."
				url="/ru/guides/real-time/getting-started/"
				icon="bolt"
			/>
			<Card
				title="Потоки"
				text="Создание пользовательских, управляемых событиями рабочих процессов обработки данных и автоматизации задач."
				url="/ru/app/flows"
				icon="flowsheet"
			/>
		</template>
		<template #пользователям>
			<Card
				title="Модуль контента"
				text="Предоставьте всем сотрудникам возможность взаимодействовать с элементами коллекции и управлять ими."
				url="/ru/user-guide/content-module/content"
				icon="deployed_code"
			/>
			<Card
				title="Управление пользователями"
				text="Узнайте о добавлении пользователей, ролей и разрешений доступа к вашим проектам."
				url="/ru/user-guide/user-management/users-roles-permissions"
				icon="group"
			/>
			<Card
				title="Файловое хранилище"
				text="Храните и извлекайте файлы, используйте адаптеры хранения, и узнайте про преобразования мультимедиа."
				url="/ru/user-guide/file-library/files"
				icon="folder_copy"
			/>
			<Card
				title="Информационные панели"
				text="Создание панелей аналитики непосредственно на основе данных вашей БД для получения важной информации о бизнесе."
				url="/ru/user-guide/insights/dashboards"
				icon="insights"
			/>
			<Card
				title="Переводы"
				text="Удобное управление многоязычным контентом делает ваши проекты доступными и удобными для глобальной аудитории."
				url="/ru/user-guide/content-module/translation-strings"
				icon="g_translate"
			/>
			<Card
				title="Directus в облаке"
				text="Изучите ключевые аспекты про Directus Cloud, основную панель управления, проекты и участников."
				url="/ru/user-guide/cloud/overview"
				icon="cloud"
			/>
		</template>
	</Tabs>
</section>

<section :class="[$style.grayBg, $style.paddingBox]">
	<div :class="[$style.sectionContainer, $style.sectionPaddingMd]">
		<div :class="$style.header">
			<h2>Руководство по фреймворкам</h2>
			<p>
				Совмещайте Directus с вашим любимым фреймворком для создания динамичных и эффективных веб-приложений.
			</p>
		</div>
		<div :class="[$style.grid3, $style.m60]">
			<Article
				title="Создание статического сайта с помощью Nuxt.js"
				desc="Узнайте, как создать сайт, используя Directus в качестве CMS и Nuxt 3."
				img="/assets/nuxt-guide.png"
				url="/ru/guides/headless-cms/build-static-website/nuxt-3"
			/>
			<Article
				title="Настройка пред-просмотра в проекте Next.js"
				desc="Добавив URL-адрес предварительного просмотра, можно мгновенно увидеть изменения, внесенные в коллекцию в реальном времени."
				img="/assets/next-guide.png"
				url="/ru/guides/headless-cms/live-preview/nextjs"
			/>
			<Article
				title="Создание многопользовательского чата с помощью React.js"
				desc="Углубленное знакомство с веб-сокетами Directus для создания интерактивного чат-приложения."
				img="/assets/react-guide.png"
				url="/ru/guides/real-time/chat/react"
			/>
		</div>
	</div>
</section>

<section :class="[$style.sectionPaddingMd, $style.paddingBox]">
	<div :class="[$style.sectionContainer, $style.sectionContainerSelfHosted]">
		<div :class="[$style.header, $style.headerSelfHosted]">
			<h2 :class="$style.headingSelfHosted">
				Установка
				<span style="white-space: nowrap">Directus</span>
			</h2>
			<p>
				Узнайте, как запустить Directus на собственной машине, настроить параметры и выполнить успешное развертывание.
			</p>
		</div>
		<div :class="[$style.grid2, $style.m60]">
			<Article
				title="Начало работы с Docker"
				desc="Начните работу с помощью нашего руководства по Docker."
				img="/assets/docker.png"
				url="/ru/self-hosted/quickstart"
			/>
			<Article
    			title="Параметры конфигурации"
    			desc="Справочник всех возможных настроек в проекте."
    			img="/assets/config-options.png"
    			url="/ru/self-hosted/config-options"
    		/>
    	</div>
    </div>
</section>

<div :class="$style.paddingBox">
	<div :class="$style.sectionContainer">
		<Divider />
	</div>
</div>

<section :class="[$style.sectionContainer, $style.sectionPaddingMd, $style.paddingBox]">
	<div :class="$style.header">
		<h2>Внесение вклада в Directus</h2>
		<p>
			Существует множество способов, с помощью которых вы можете внести свой вклад в развитие проекта Directus.
		</p>
		<div :class="$style.buttonGroup">
			<Button href="https://discord.com/invite/directus" external>Вступить в сообщество</Button>
			<Button secondary :icon="Github" href="https://github.com/directus/directus/" external>GitHub</Button>
		</div>
	</div>
	<div :class="[$style.grid3, $style.m60]">
		<Card
			h="3"
			title="Запросить функцию"
			text="Предлагайте новые возможности для улучшения Directus. Узнайте, как мы используем GitHub Discussions для организации запросов."
			url="/ru/contributing/feature-request-process"
			icon="post_add"
		/>
		<Card
			h="3"
			title="Внести вклад через код"
			text="Оказывайте значительное влияние, внося свой вклад в код. Ознакомьтесь с нашим процессом подачи заявок и узнайте о нашем CLA."
			url="/ru/contributing/introduction"
			icon="code"
		/>
		<Card
			h="3"
			title="Спонсорство и продвижение"
			text="Станьте спонсором нашего проекта, повысьте его узнаваемость и узнайте, как рассказать о нем другим!"
			url="/ru/contributing/sponsor"
			icon="handshake"
		/>
	</div>
</section>

<Footer />

<style module>
@import './../home.css';
</style>
