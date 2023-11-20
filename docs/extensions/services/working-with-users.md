---
description: Learn about the required services when working with users and granting them access control.
contributors: Esther Agbaje
---

# Working with Users

There are various services related to users:

- `UsersService`: Used to manage user accounts and perform CRUD operations on user profiles
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
router.get('/users/:email', async (req, res) => {
  const usersService = new UsersService({ schema });
  const { email } = req.params;
  const data = await usersService.getUserByEmail(email);

  res.locals['payload'] = { data: data || null };
  res.json(data);
});
```

### Create a Role

```js
router.post('/roles', async (req, res) => {
  const rolesService = new RolesService({ schema });
  const data = await rolesService.createOne(req.body);

  res.locals['payload'] = { data: data || null };
  res.json(data);
});
```

### Create a User and Assign a Role

```js
router.post('/users/:role', async (req, res) => {
  const schema = await getSchema();
  const usersService = new UsersService({ schema });
  const rolesService = new RolesService({ schema });

  const { role } = req.params;
  const roles = await rolesService.readByQuery({
    fields: ['*'],
  });

  const foundRole = roles.find((item) => item.name == role);

  const data = await usersService.createOne({
    ...req.body,
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
router.patch('/users/:id', async (req, res) => {
  const usersService = new UsersService({ schema });
  const { id } = req.params;

  const data = await usersService.updateOne(id, req.body);
  res.locals['payload'] = { data: data || null };
  res.json(data);
});
```

### Delete User

```js
router.delete('/users/:id', async (req, res) => {
  const usersService = new UsersService({ schema });
  const { id } = req.params;
  const data = await usersService.deleteOne(id);

  res.locals['payload'] = { data: data || null };
  res.json(data);
});
```

### Assign Permission to a Role

```js
router.post('/permissions/:role', async (req, res) => {
  const schema = await getSchema();
  const permissionsService = new PermissionsService({ schema });
  const rolesService = new RolesService({ schema });

  const { role } = req.params;
  const roles = await rolesService.readByQuery({
      fields: ['*'],
    });

  const foundRole = roles.find((item) => item.name == role);

  const data = await permissionsService.createOne({
    ...req.body,
    role: foundRole.id,
  });

  res.locals['payload'] = { data: data || null };
  res.json(data);
});
```

::: tip Explore Services In-depth

Check out the full list of methods [in our codebase](https://github.com/directus/directus/blob/main/api/src/services).

:::
