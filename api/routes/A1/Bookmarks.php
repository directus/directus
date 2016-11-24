<?php

namespace Directus\API\Routes\A1;

use Directus\Application\Route;
use Directus\Database\TableGateway\DirectusBookmarksTableGateway;
use Directus\View\JsonView;

class Bookmarks extends Route
{
    public function bookmarks($id = null)
    {
        $app = $this->app;
        $acl = $app->container->get('acl');
        $ZendDb = $app->container->get('zenddb');
        $requestPayload = $app->request()->post();

        $currentUserId = $acl->getUserId();
        $bookmarks = new DirectusBookmarksTableGateway($ZendDb, $acl);
        switch ($app->request()->getMethod()) {
            case 'PUT':
                $bookmarks->updateBookmark($requestPayload);
                $id = $requestPayload['id'];
                break;
            case 'POST':
                $requestPayload['user'] = $currentUserId;
                $id = $bookmarks->insertBookmark($requestPayload);
                break;
            case 'DELETE':
                $bookmark = $bookmarks->fetchByUserAndId($currentUserId, $id);
                if ($bookmark) {
                    echo $bookmarks->delete(['id' => $id]);
                }
                return;
        }

        $jsonResponse = $bookmarks->fetchByUserAndId($currentUserId, $id);

        JsonView::render($jsonResponse);
    }
}