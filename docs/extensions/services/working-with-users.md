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

### Get a User

```js
router.get('/users/:email', async (req, res) => {
  const schema = await getSchema();
  const service = new UsersService({ schema });
  const { email } = req.params;

  const data = await service.getUserByEmail(email);
  res.locals['payload'] = { data: data || null };
  res.json(data);
});
```

### Create a Role

```js
router.post('/roles', async (req, res) => {
  const schema = await getSchema();
  const service = new RolesService({ schema });
  const data = await service.createOne(req.body);

  res.locals['payload'] = { data: data || null };
  res.json(data);
});
```

### Create and Assign User to a Role

```js
router.post('/users/:role', async (req, res) => {
  const schema = await getSchema();
  const userService = new UsersService({ schema });
  const roleService = new RolesService({ schema });

  const { role } = req.params;
  const roles = await roleService.readByQuery({
    fields: ['*'],
  });

  const foundRole = roles.find((item) => item.name == role);

  const data = await userService.createOne({
    ...req.body,
    role: foundRole.id,
  });

  res.locals['payload'] = { data: data || null };
  res.json(data);
});
```

### Assign Permission to a Role

```js
router.post('/permissions/:role', async (req, res) => {
  const schema = await getSchema();
  const permissionService = new PermissionsService({ schema });
  const roleService = new RolesService({ schema });

  const { role } = req.params;
  const roles = await roleService.readByQuery({
      fields: ['*'],
    });

  const foundRole = roles.find((item) => item.name == role);

  const data = await permissionService.createOne({
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
