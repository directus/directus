<?php

namespace Directus\API\Routes\A1;

use Directus\Application\Route;
use Directus\Database\TableGateway\DirectusBookmarksTableGateway;
use Directus\Database\TableGateway\DirectusPreferencesTableGateway;
use Directus\Database\TableGateway\RelationalTableGateway;
use Directus\Permissions\Acl;

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
        $preferences = new DirectusPreferencesTableGateway($ZendDb, null);

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
                $bookmark = $bookmarks->fetchEntityByUserAndId($currentUserId, $id);
                $response = [];

                if (!empty($bookmark['data'])) {
                    $response['success'] = (bool) $bookmarks->delete(['id' => $id]);

                    // delete the preferences
                    $preferences->delete([
                        'user' => $currentUserId,
                        'title' => $bookmark['data']['title']
                    ]);
                } else {
                    $response['success'] = false;
                    $response['error'] = [
                        'message' => 'bookmark_not_found'
                    ];
                }

                return $this->app->response($response);
        }

        if (!is_null($id)) {
            $jsonResponse = $this->getDataAndSetResponseCacheTags([$bookmarks, 'fetchEntityByUserAndId'], [$currentUserId, $id]);
        } else {
            $jsonResponse = $this->getDataAndSetResponseCacheTags([$bookmarks, 'fetchEntitiesByUserId'], [$currentUserId]);
        }

        return $app->response($jsonResponse);
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
        }

        $jsonResponse = $this->getDataAndSetResponseCacheTags([$bookmarks, 'fetchEntitiesByUserId'], [$currentUserId]);

        return $app->response($jsonResponse);
    }

    // @NOTE: duplicate selfBookmarks
    public function userBookmarks($currentUserId)
    {
        $app = $this->app;
        $acl = $app->container->get('acl');
        $ZendDb = $app->container->get('zenddb');
        $requestPayload = $app->request()->post();

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
        }

        $jsonResponse = $this->getDataAndSetResponseCacheTags([$bookmarks, 'fetchEntitiesByUserId'], [$currentUserId]);

        return $app->response($jsonResponse);
    }

    public function allBookmarks()
    {
        $app = $this->app;
        $acl = $app->container->get('acl');
        $ZendDb = $app->container->get('zenddb');
        $tableGateway = new RelationalTableGateway('directus_bookmarks', $ZendDb, $acl);

        $params = $app->request()->get();
        return $this->app->response($this->getEntriesAndSetResponseCacheTags($tableGateway, $params));
    }

    public function preferences($title)
    {
        $app = $this->app;
        /** @var Acl $acl */
        $acl = $app->container->get('acl');
        $dbConnection = $app->container->get('zenddb');
        $tableGateway = new DirectusPreferencesTableGateway($dbConnection, $acl);

        $response = $this->getDataAndSetResponseCacheTags([$tableGateway, 'fetchEntityByUserAndTitle'], [$acl->getUserId(), $title]);

        if (!$response['data']) {
            $response = [
                'success' => false,
                'error' => [
                    'message' => __t('bookmark_not_found')
                ]
            ];
        } else {
            $response['success'] = true;
        }

        return $app->response($response);
    }
}
