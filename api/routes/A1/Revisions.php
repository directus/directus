<?php

namespace Directus\API\Routes\A1;

use Directus\Application\Route;
use Directus\Database\TableGateway\DirectusActivityTableGateway;
use Directus\View\JsonView;

class Revisions extends Route
{
    public function revisions($table, $id)
    {
        $ZendDb = $this->app->container->get('zenddb');
        $acl = $this->app->container->get('acl');
        $params = $this->app->request()->get();

        $params['table_name'] = $table;
        $params['id'] = $id;

        $Activity = new DirectusActivityTableGateway($ZendDb, $acl);

        $revisions = $this->getDataAndSetResponseCacheTags(
            [$Activity, 'fetchRevisions'],
            [$id, $table]
        );

        return $this->app->response($revisions);
    }
}
