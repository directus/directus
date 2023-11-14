---
description: Learn about the required services when working with users and granting them access control.
contributors: Esther Agbaje
---

# Working with Users

Directus provides a comprehensive set of services that facilitate seamless collaboration with users while enforcing
access control to specific roles. They include:

- `UsersService`: Extends the `ItemsService` and is used to manage user accounts and perform CRUD operations on user
  profiles
- `RolesServices`: Extends the `ItemsService` and enables you to assign roles to users.
- `PermissionsServices`: Extends the `ItemsService` and allows you to manage the permissions associated with each role.

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
    const service = new UsersService({ schema });
    const roleService = new RolesService({ schema });

    const { role } = req.params;
    const roles = await roleService.readByQuery({
      fields: ['*'],
    });

    const foundRole = roles.find(
      (item: any) => item.name.toLowerCase() === role.toLowerCase()
    );

    const data = await service.createOne({
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
    const service = new PermissionsService({ schema });
    const roleService = new RolesService({ schema });

    const { role } = req.params;

    const roles = await roleService.readByQuery({
      fields: ['*'],
    });

    const foundRole = roles.find(
      (item: any) => item.name.toLowerCase() === role.toLowerCase()
    );

    const data = await service.createOne({
      ...req.body,
      role: foundRole.id,
    });

    res.locals['payload'] = { data: data || null };

    res.json(data);
  });
```

::: tip Explore Services In-depth

Check out the full list [here](https://github.com/directus/main/api/src/services/users.ts).

:::
