<?php

namespace Directus\API\Routes\A1;

use Directus\Application\Route;
use Directus\Database\TableGateway\DirectusBookmarksTableGateway;
use Directus\Database\TableGateway\RelationalTableGateway;
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
                $response = [];
                if ($bookmark) {
                    $response['success'] = (bool) $bookmarks->delete(['id' => $id]);
                } else {
                    $response['success'] = false;
                    $response['error'] = [
                        'message' => 'bookmark_not_found'
                    ];
                }

                return JsonView::render($response);
        }

        if (!is_null($id)) {
            $jsonResponse = $bookmarks->fetchByUserAndId($currentUserId, $id);
        } else {
            $jsonResponse = $bookmarks->fetchByUserId($currentUserId);
        }

        return JsonView::render([
            'meta' => [
                'table' => 'directus_bookmarks',
                'type' => is_null($id) ? 'collection' : 'item'
            ],
            'data' => $jsonResponse
        ]);
    }

    public function selfBookmarks()
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

        $jsonResponse = $bookmarks->fetchByUserId($currentUserId);

        return JsonView::render([
            'meta' => [
                'table' => 'directus_bookmarks',
                'type' => 'collection'
            ],
            'data' => $jsonResponse
        ]);
    }

    public function allBookmarks()
    {
        $app = $this->app;
        $acl = $app->container->get('acl');
        $ZendDb = $app->container->get('zenddb');
        $tableGateway = new RelationalTableGateway('directus_bookmarks', $ZendDb, $acl);

        $params = $app->request()->get();
        return JsonView::render($tableGateway->getItems($params));
    }
}