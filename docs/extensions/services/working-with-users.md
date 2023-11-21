---
description: Learn about the required services when working with users and granting them access control.
contributors: Esther Agbaje
---

# Working with Users

There are various services related to users:

- `UsersService`: Used to manage user accounts and perform CRUD operations on user profiles.
- `RolesServices`: Used to assign roles to users.
- `PermissionsServices`: Used to manage the permissions associated with each role.

All three of these services extend the [ItemsService](/docs/extensions/services/accessing-items.md) and are used in a
very similar way.

```js
export default defineEndpoint(async (router, context) => {
  const { services, getSchema } = context;
  const { UsersService, RolesService, PermissionsService } = services;
  const schema = await getSchema();

  router.get('/', async (req, res) => {
    const usersService = new usersService({ schema });
  });
});
```

### Get User

```js
router.get('/', async (req, res) => {
  const usersService = new UsersService({ schema });

  const data = await usersService.getUserByEmail('email');

  res.locals['payload'] = { data: data || null };
  res.json(data);
});
```

### Create a Role

```js
router.post('/', async (req, res) => {
  const rolesService = new RolesService({ schema });
  const data = await rolesService.createOne({
    name: 'Interns',
    icon: 'verified_user',
    description: null,
    admin_access: false,
    app_access: true,
  });

  res.locals['payload'] = { data: data || null };
  res.json(data);
});
```

### Create a User and Assign a Role

```js
router.post('/', async (req, res) => {
  const usersService = new UsersService({ schema });
  const rolesService = new RolesService({ schema });

  const roles = await rolesService.readByQuery({
    fields: ['*'],
  });

  const foundRole = roles.find((item) => item.name == 'role');

  const data = await usersService.createOne({
    icon: 'attractions',
    role: foundRole.id,
  });

  res.locals['payload'] = { data: data || null };
  res.json(data);
});
```

::: warning Creating a User

A role is required when creating a user.

:::

### Update User

```js
router.patch('/', async (req, res) => {
  const usersService = new UsersService({ schema });

  const data = await usersService.updateOne('user_id', {
    title: 'CTO'
  });
  res.locals['payload'] = { data: data || null };
  res.json(data);
});
```

### Delete User

```js
router.delete('/', async (req, res) => {
  const usersService = new UsersService({ schema });
  const data = await usersService.deleteOne('user_id');

  res.locals['payload'] = { data: data || null };
  res.json(data);
});
```

### Assign Permission to a Role

```js
router.post('/', async (req, res) => {
	const permissionsService = new PermissionsService({ schema });
	const rolesService = new RolesService({ schema });

	const roles = await rolesService.readByQuery({
		fields: ['*'],
	});

	const foundRole = roles.find((item) => item.name == 'role');

	const data = await permissionsService.createOne({
		collection: 'pages',
		action: 'read',
		role: 'c86c2761-65d3-43c3-897f-6f74ad6a5bd7',
		fields: ['id', 'title'],
		role: foundRole.id,
	});

	res.locals['payload'] = { data: data || null };
	res.json(data);
});
```

::: tip Explore Services In-depth

Refer to the full list of methods [in our codebase](https://github.com/directus/directus/blob/main/api/src/services).

:::
