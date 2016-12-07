<?php

namespace Directus\API\Routes\A1;

use Directus\Application\Route;
use Directus\Database\TableGateway\DirectusActivityTableGateway;
use Directus\Util\ArrayUtils;
use Directus\Util\DateUtils;
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
        if (!$params['filters']) {
            $params['filters'] = [];
        }

        if (!ArrayUtils::has($params, 'filters.datetime')) {
            $params['filters']['datetime'] = ['>=' => DateUtils::daysAgo(30)];
        }

        $data = $Activity->fetchFeed($params);
        JsonView::render([
            'meta' => [
                'type' => 'collection',
                'table' => 'directus_activity',
                'total' => $data['total']
            ],
            'data' => ArrayUtils::get($data, 'data', [])
        ]);
    }
}