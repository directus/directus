<?php

namespace Directus\Database\TableGateway;

use Directus\Permissions\Acl;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Ddl\Column\Varbinary;
use Zend\Db\Sql\Insert;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Update;

class DirectusBookmarksTableGateway extends RelationalTableGateway
{
    public static $_tableName = 'directus_bookmarks';

    public $primaryKeyFieldName = 'id';

    public function __construct(AdapterInterface $adapter, Acl $acl = null)
    {
        parent::__construct(self::$_tableName, $adapter, $acl);
    }

    public static $defaultBookmarksValues = [
        'Activity' => [
            'title' => 'Activity',
            'url' => 'activity',
            'section' => 'other'
        ],
        'Files' => [
            'title' => 'Files',
            'url' => 'files',
            'section' => 'other'
        ],
        'Messages' => [
            'title' => 'Messages',
            'url' => 'messages',
            'section' => 'other'
        ],
        'Users' => [
            'title' => 'Users',
            'url' => 'users',
            'section' => 'other'
        ]
    ];

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

    /**
     * @deprecated
     * @param $user_id
     * @param $id
     * @return array
     */
    public function fetchByUserAndId($user_id, $id)
    {
        $result = $this->fetchEntityByUserAndId($user_id, $id);

        return ($result['data']) ? $result['data'] : [];
    }

    /**
     * @param $user_id
     * @param $id
     * @return array|mixed
     */
    public function fetchEntityByUserAndId($user_id, $id)
    {
        $result = $this->getEntries([
            $this->primaryKeyFieldName => $id,
            'filters' => [
                'user' => $user_id
            ]
        ]);

        return $result;
    }

    /**
     * @deprecated
     * @param $userId
     * @return array|mixed
     */
    public function fetchByUserId($userId)
    {
        $result = $this->fetchEntitiesByUserId($userId);

        return ($result['data']) ? $result['data'] : [];
    }

    /**
     * Gets all the bookmarks for the given user
     *
     * @param $userId
     *
     * @return array
     */
    public function fetchEntitiesByUserId($userId)
    {
        $result = $this->getEntries([
            'filters' => [
                'user' => $userId
            ]
        ]);

        return $result;
    }

    public function fetchAllByUser($userId)
    {
        $select = new Select($this->table);
        $select->where->equalTo('user', $userId);

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
            $data = [
                'user' => $userId
            ];

            $row = $this->createDefaultBookmark($defaultBookmark, $data);
            $id = $this->insertBookmark($row);

            $bookmarks[$defaultBookmark] = $row;
        }

        return $bookmarks;
    }
}
