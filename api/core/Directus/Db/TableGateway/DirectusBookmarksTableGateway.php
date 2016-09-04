<?php

namespace Directus\Db\TableGateway;

use Directus\Acl\Acl;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Insert;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Update;

class DirectusBookmarksTableGateway extends AclAwareTableGateway
{

    public static $_tableName = 'directus_bookmarks';

    public function __construct(Acl $acl, AdapterInterface $adapter)
    {
        parent::__construct($acl, self::$_tableName, $adapter);
    }

    public static $defaultBookmarksValues = array(
        'Activity' => array(
            'title' => 'Activity',
            'url' => 'activity',
            'icon_class' => 'icon-bell',
            'section' => 'other'),
        'Files' => array(
            'title' => 'Files',
            'url' => 'files',
            'icon_class' => 'icon-attach',
            'section' => 'other'),
        'Messages' => array(
            'title' => 'Messages',
            'url' => 'messages',
            'icon_class' => 'icon-chat',
            'section' => 'other'),
        'Users' => array(
            'title' => 'Users',
            'url' => 'users',
            'icon_class' => 'icon-users',
            'section' => 'other')
    );

    public function createDefaultBookmark($title, $bookmark)
    {
        // Global default values
        if (isset(self::$defaultBookmarksValues[$title])) {
            foreach (self::$defaultBookmarksValues[$title] as $field => $defaultValue) {
                if (!isset($bookmark[$field]) || ('0' !== $bookmark[$field] && empty($bookmark[$field]))) {
                    if (!isset($bookmark[$field])) {
                        $bookmark[$field] = $defaultValue;
                    }
                }
            }
        }
        return $bookmark;
    }

    public function updateBookmark($payload)
    {
        $update = new Update($this->table);
        $update->set($payload);
        $this->updateWith($update);
    }

    public function insertBookmark($payload)
    {
        $insert = new Insert($this->table);
        $insert->values($payload);
        $this->insertWith($insert);
        return $this->lastInsertValue;
    }

    public function fetchByUserAndId($user_id, $id)
    {
        $select = new Select($this->table);
        $select->limit(1);
        $select
            ->where
            ->equalTo('id', $id)
            ->equalTo('user', $user_id);

        $bookmarks = $this
            ->selectWith($select)
            ->current();

        if ($bookmarks) {
            $bookmarks = $bookmarks->toArray();
        }

        return $bookmarks;
    }

    public function fetchAllByUser($user_id)
    {
        $select = new Select($this->table);
        $select
            ->where
            ->equalTo('user', $user_id);

        $bookmarks = $this->selectWith($select)->toArray();

        $defaultBookmarks = array_keys(self::$defaultBookmarksValues);

        foreach ($bookmarks as $index => $row) {
            $title = $row['title'];

            if (($key = array_search($title, $defaultBookmarks)) !== false) unset($defaultBookmarks[$key]);

            if (!isset($row['user'])) {
                $row = null;
            }

            // force: no activity nav item
            if ($row['url'] == 'activity') {
                unset($bookmarks[$index]);
                continue;
            }

            $bookmarks[$title] = $row;
        }

        foreach ($defaultBookmarks as $defaultBookmark) {
            $data = array(
                'user' => $user_id
            );

            $row = $this->createDefaultBookmark($defaultBookmark, $data);
            $id = $this->insertBookmark($row);

            $bookmarks[$defaultBookmark] = $row;
        }

        return $bookmarks;
    }
}
