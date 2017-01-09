<?php

namespace Directus\API\Routes\A1;

use Directus\Application\Route;

class Users extends Route
{
    // /1.1/users
    public function all()
    {
        $entries = new Entries($this->app);

        return $entries->rows('directus_users');
    }

    // /1.1/users/:id
    public function get($id)
    {
        $entries = new Entries($this->app);

        return $entries->row('directus_users', $id);
    }
}