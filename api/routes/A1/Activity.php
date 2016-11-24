<?php

namespace Directus\API\Routes\A1;

use Directus\Application\Route;
use Directus\Database\TableGateway\DirectusActivityTableGateway;
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
        if (!$params['adv_search']) {
            unset($params['perPage']);
            $params['adv_search'] = 'datetime >= "' . DateUtils::daysAgo(30) . '"';
        }
        $new_get = $Activity->fetchFeed($params);
        $new_get['active'] = $new_get['total'];
        JsonView::render($new_get);
    }
}