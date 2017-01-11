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

        $data = $Activity->fetchFeed($params);

        return JsonView::render($data);
    }
}