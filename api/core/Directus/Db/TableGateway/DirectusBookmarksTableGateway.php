<?php

namespace Directus\Db\TableGateway;

use Directus\Acl\Acl;
use Directus\Bootstrap;
use Directus\Db\TableGateway\AclAwareTableGateway;
use Directus\Db\TableGateway\RelationalTableGateway;
use Directus\Db\TableSchema;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\Select;

class DirectusBookmarksTableGateway extends AclAwareTableGateway {

    public static $_tableName = "directus_bookmarks";

    public function __construct(Acl $acl, AdapterInterface $adapter) {
        parent::__construct($acl, self::$_tableName, $adapter);
    }

    public static $defaultBookmarksValues = array(
      'Tables' => array(
        "title"          => "Tables",
        "url"    => "tables",
        "icon_class"        => "icon-database"),
      'Settings' => array(
        "title"          => "Settings",
        "url"    => "settings",
        "icon_class"        => "icon-cog")
    );

    public function createDefaultBookmark($title, $bookmark) {
        // Global default values

      if(isset(self::$defaultBookmarksValues[$title])) {
        foreach(self::$defaultBookmarksValues[$title] as $field => $defaultValue) {
          if(!isset($bookmark[$field]) || ("0" !== $bookmark[$field] && empty($bookmark[$field]))) {
            if(!isset($bookmark[$field])) {
                $bookmark[$field] = $defaultValue;
            }
          }
        }
      }
      return $bookmark;
    }

    public function fetchByUserAndTitle($user_id, $title) {
        $select = new Select($this->table);
        $select->limit(1);
        $select
            ->where
                ->equalTo('title', $title)
                ->equalTo('user', $user_id);

        $bookmarks = $this
            ->selectWith($select)
            ->current();

        if($bookmarks) {
            $bookmarks = $bookmarks->toArray();
        }

        return $bookmarks;
    }

    public function fetchAllByUser($user_id) {
        $db = Bootstrap::get('olddb');

        $sql =
            'SELECT
                id,
                user,
                title,
                url,
                icon_class
            FROM
                directus_bookmarks
            WHERE
                directus_bookmarks.user = :user';

        $sth = $db->dbh->prepare($sql);
        $sth->bindValue(':user', $user_id, \PDO::PARAM_INT);
        $sth->execute();

        $bookmarks = array();

        $defaultBookmarks = array('Tables', 'Settings');

        while ($row = $sth->fetch(\PDO::FETCH_ASSOC)) {
            $title = $row['title'];

            if (($key = array_search($title, $defaultBookmarks)) !== false) unset($defaultBookmarks[$key]);

            if (!isset($row['user'])) {
                $row = null;
            }

            $bookmarks[$title] = $row;
        }
        foreach($defaultBookmarks as $defaultBookmark) {
          $data = array(
            'user' => $user_id
          );

          $row = $this->createDefaultBookmark($defaultBookmark, $data);
          $id = $db->set_entry(self::$_tableName, $row);

          $bookmarks[$defaultBookmark] = $row;
        }

        return $bookmarks;
    }



}
