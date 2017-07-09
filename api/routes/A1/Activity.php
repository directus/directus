<?php

namespace Directus\API\Routes\A1;

use Directus\Application\Route;
use Directus\Database\TableGateway\DirectusActivityTableGateway;
use Directus\Util\ArrayUtils;
use Directus\View\JsonView;

class Activity extends Route
{
    public function activity()
    {
        $ZendDb = $this->app->container->get('zenddb');
        $acl = $this->app->container->get('acl');
        $params = $this->app->request()->get();

        $Activity = new DirectusActivityTableGateway($ZendDb, $acl);
        // @todo move this to backbone collection
        if (!ArrayUtils::has($params, 'filters')) {
            $params['filters'] = [];
        }

        // a way to get records last updated from activity
        if (ArrayUtils::get($params, 'last_updated')) {
            $table = key($params['last_updated']);
            $ids = ArrayUtils::get($params, 'last_updated.' . $table);
            $arrayOfIds = $ids ? explode(',', $ids) : [];
            $data = $Activity->getLastUpdated($table, $arrayOfIds);
        } else {
            $data = $Activity->fetchFeed($params);
        }

        return $this->app->response($data);
    }
}
