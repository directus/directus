---
description: Learn about the required services when working with users and granting them access control.
contributors: Esther Agbaje
---

# Working with Users

There are various services related to users:

- `UsersService`: Used to manage user accounts and perform CRUD operations on user profiles.
- `RolesServices`: Used to assign roles to users.
- `PermissionsServices`: Used to manage the permissions associated with each role.

All three of these services extend the [ItemsService](/extensions/services/accessing-items) and are used in a very
similar way.

```js
export default defineEndpoint((router, context) => {
  const { services, getSchema } = context;
  const { UsersService, RolesService, PermissionsService } = services;

  router.get('/', async (req, res) => {
    const schema = await getSchema();
    const usersService = new UsersService({ schema, accountability: req.accountability });
    const rolesService = new RolesService({ schema, accountability: req.accountability });
    const permissionsService = new PermissionsService({ schema, accountability: req.accountability });

    // Your route handler logic
  });
});
```

## Get a User

```js
router.get('/', async (req, res) => {
  const usersService = new UsersService({
    schema: await getSchema(),
    accountability: req.accountability
  });

  const data = await usersService.readByQuery({
		fields: ['*'],
		filter: { email: { _eq: 'email' } },
	});

  res.json(data);
});
```

## Create a Role

```js
router.post('/', async (req, res) => {
  const rolesService = new RolesService({
    schema: await getSchema(),
    accountability: req.accountability
  });

  const data = await rolesService.createOne({
    name: 'Interns',
    icon: 'verified_user',
    description: null,
    admin_access: false,
    app_access: true,
  });

  res.json(data);
});
```

## Create a User and Assign a Role

```js
router.post('/', async (req, res) => {
  const rolesService = new RolesService({
    schema: await getSchema(),
    accountability: req.accountability
  });

  const roles = await rolesService.readByQuery({
    fields: ['*'],
  });

  const foundRole = roles.find((item) => item.name == 'role');

  const data = await usersService.createOne({
    icon: 'attractions',
    role: foundRole.id,
  });

  res.json(data);
});
```

::: warning Creating a User

A role is required when creating a user.

:::

## Update a User

```js
router.patch('/', async (req, res) => {
  const usersService = new UsersService({
    schema: await getSchema(),
    accountability: req.accountability
  });

  const data = await usersService.updateOne('user_id', {
    title: 'CTO'
  });

  res.json(data);
});
```

## Delete a User

```js
router.delete('/', async (req, res) => {
  const usersService = new UsersService({
    schema: await getSchema(),
    accountability: req.accountability
  });

  const data = await usersService.deleteOne('user_id');

  res.json(data);
});
```

## Assign Permission to a Role

```js
router.post('/', async (req, res) => {
  const schema = await getSchema();
  const rolesService = new RolesService({ schema,	accountability: req.accountability });
  const permissionsService = new PermissionsService({ schema, accountability: req.accountability });

  const roles = await rolesService.readByQuery({
	  fields: ['*'],
	  filter: {
		  name: {
			  _eq: 'role'
		  }
	  }
  });

  const foundRole = roles[0];

  const data = await permissionsService.createOne({
	  collection: 'pages',
	  action: 'read',
	  role: 'c86c2761-65d3-43c3-897f-6f74ad6a5bd7',
	  fields: ['id', 'title'],
	  role: foundRole.id,
  });

  res.json(data);
});
```

::: tip Explore Services In-Depth

Refer to the full list of methods [in our codebase](https://github.com/directus/directus/blob/main/api/src/services).

:::
