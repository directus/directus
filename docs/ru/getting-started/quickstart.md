---
description:
  Вы можете начать работу с Directus Cloud за считанные минуты. Изучите основы построения модели данных и управления правами доступа.
readTime: 7 min read
---

# Начальное руководство

> Это краткое руководство предназначено для быстрого запуска проекта Directus. В процессе обучения вы лучше поймете,
> что такое Directus, настроите свой облачный аккаунт Directus Cloud, получите практическое представление о приложении и API,
> а также найдете дополнительные ресурсы для детального изучения.

Данное руководство в основном посвящено началу работы с Directus Cloud.
Если вы предпочитаете самостоятельный хостинг, мы предлагаем руководство в помощь вам в этом процессе.

<Card
  title="Самостоятельное развертывание Directus"
  h="2"
  text="Узнайте, как запустить Directus на собственной машине и самостоятельно разместить его на хостинге."
  url="/self-hosted/quickstart"
  icon="rocket_launch"
  add-margin
/>

## 1. Создание облачной учетной записи и вход в систему

Сначала необходимо создать учетную запись и войти в [Directus Cloud](https://directus.cloud/login).

Ваш облачный аккаунт Directus Cloud позволяет создавать и управлять любым количеством проектов.\
Мы упростили жизнь, предоставив вам возможность автоматически создавать и входить в ваш облачный аккаунт с помощью GitHub. \
Если у вас нет учетной записи GitHub или вы предпочитаете не использовать этот способ входа, вы также можете войти в аккаунт по электронной почте и паролю.

При первом входе в облачный аккаунт вам будет предложено создать команду.\
Каждый проект Directus Cloud существует в рамках одной команды.\
Они позволяют организовать членов команды, проекты и биллинг проектов по своему усмотрению.

После того как команда создана, настало время создать проект Directus Cloud!

## 2. Создание и получение доступа к проекту

Для создания проекта выполните следующие действия:

1. Откройте меню "Команда" в шапке панели инструментов и выберите или создайте нужную команду.
2. Перейдите в раздел **"Проекты "** и нажмите кнопку **"Создать проект "**.
3. Задайте имя и уровень проекта.
4. Прокрутите экран в самый низ и выберите начальный шаблон **"Пустой проект "**.\
   Примечание: При выборе **"Демонстрационный проект "** добавляются фиктивные данные для расширенной демонстрации возможностей.
5. Нажмите кнопку **"Создать проект "**.

_На запуск облачного проекта системе потребуется около 90 секунд.\
В течение этого времени будет отправлена ссылка на адрес электронной почты связанный с вашей учетной записью Cloud.\
В письме будет указан URL-адрес проекта, а также адрес электронной почты и пароль для входа в систему.\
Если для создания учетной записи вы использовали GitHub, то это будет ваш адрес электронной почты GitHub.\
После завершения этапа установки можно войти в систему!_

6. You can access a Project from within the Cloud Dashboard or type the URL into your browser.
7. Log in with your username and password from the email.

::: tip Check All Inbox Folders

Due to the algorithms used by some email providers, it is possible the email containing your Project login information
will end up in another folder like "Social" or "Promotions".

:::

## 3. Create a Collection

Once logged in, you're greeted with the option to create your first
[Collection](/user-guide/overview/glossary#collections).

1. Navigate into the Content Module.
2. Click **"Create Collection"** and a side menu will appear.
3. Fill in a **Name**.\
   For the sake of this demo, we'll call ours `articles`, but feel free to make it your own!
4. Leave the other options at default. Click <span mi btn>arrow_forward</span> and the **"Optional System Fields"** menu
   will open.\
   Keep the values in this menu at the default, toggled off, for now. You can adjust them later.
5. Click <span mi btn>check</span> in the menu header.

::: tip Learn More About Collections

- [The Content Module](/user-guide/content-module/content)
- [Create and Manage a Collection](/app/data-model/collections)
- [Build Relationships Between Collections](/app/data-model/relationships)

:::

## 4. Create a Field

With your first Collection created, it's time to start adding some [Fields](/user-guide/overview/glossary#fields).

1. Navigate to **Settings Module > Data Model > `Collection-Name`**.
2. Click the **"Create Field"** button and select the **"Input"** Field type.
3. Fill in a Field name under **Key**. We'll be calling our Field `title`.\
   Directus offers powerful Field customization options, but let's stick to the defaults for now.
4. Select **"Save"**.

::: tip Learn More About Fields

- [Create and Manage Fields in the App](/app/data-model)

:::

## 5. Create an Item

Now that we have a Collection with a Field configured, it's time to add an [Item](/user-guide/overview/glossary#).

1. Navigate to the Content Module.
2. Click <span mi btn>add</span> in the page header to open the Item Page.
3. Fill in the Field Value(s) as desired.
4. Click <span mi btn>check</span> in the top-right to save your Item.

::: tip Learn More About Items

- [The Content Module](/user-guide/content-module/content)
- [The Item Page](/user-guide/content-module/content/items)

:::

## 6. Set Roles & Permissions

Directus comes with two built-in roles: Public and Admin. The Public Role determines what data is returned to
non-authenticated users. Public comes with all permissions turned off and can be reconfigured with fully granular
control to expose exactly what you want unauthenticated Users to see. The Admin role has full permissions and this
cannot be changed. Aside from these built-in Roles, any number of new Roles can be created, all with fully customized,
granular permissions.

By Default, content entered into Directus will be considered private. So permissions always start off set to the default
of <span mi icon dngr>block</span> **No Access**, with full ability to reconfigure as desired. So, in order to have the
API return our Items, let's add some read permissions. For simplicity's sake, we'll do this on the Public Role, instead
of creating a new Role.

1. Navigate to **Settings Module > Roles & Permissions > Public**.
2. Click <span mi icon dngr>block</span> under the <span mi icon>visibility</span> icon on the desired Collection.\
   In our case, the Collection name is `articles`.
3. Click **"All Access"** to give the Public Role full read permissions to the Items in this Collection.

::: tip Learn More About Roles & Permissions

- [Users, Roles and Permissions](/user-guide/user-management/users-roles-permissions).

:::

## 7. Connect to the API

Now that your Project has some content in it which is exposed to the Public, it's time to start using this content
externally! Data can be accessed in a number of ways, including the REST and GraphQL API endpoints. In this case, we'll
use the `/items/` [REST API endpoint](/reference/items) to retrieve the Item we just created.

1. Open `http://your-project-url.directus.app/items/articles`.\
   You can use the browser or an API tool like [Postman](http://postman.com) or [Paw](https://paw.cloud)

_And there it is! The Article Item you just created is being served in beautiful JSON, ready to be used anywhere and
everywhere!_

```json
{
	"data": [
		{
			"id": 1,
			"title": "Hello World!"
		}
	]
}
```

_In this example, we made a super-simple read request with the API, but there's more! The REST and GraphQL APIs provide
exhaustive endpoints for the data model and every single action that you can do in the App can be done via the API. In
fact, the App is just a GUI powered by the API._

::: tip Learn More About The API

- [Intro to the API](/reference/introduction)
- [JavaScript SDK](/guides/sdk/getting-started)

:::
