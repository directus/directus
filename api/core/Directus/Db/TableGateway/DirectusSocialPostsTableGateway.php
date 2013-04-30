<?php

namespace Directus\Db\TableGateway;

use Directus\Acl\Acl;
use Directus\Db\TableGateway\AclAwareTableGateway;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\Select;

class DirectusSocialPostsTableGateway extends AclAwareTableGateway {

    public static $_tableName = "directus_social_posts";

    public function __construct(Acl $aclProvider, AdapterInterface $adapter) {
        parent::__construct($aclProvider, self::$_tableName, $adapter);
    }

    public function feedForeignIdExists($foreign_id, $feed_id) {
        $select = new Select($this->table);
        $select
            ->limit(1)
            ->where
                ->equalTo('foreign_id', $foreign_id)
                ->equalTo('feed', $feed_id);
        // die($this->dumpSql($select));
        $result = $this->selectWith($select);
        $result = $result->current();
        return $result;
    }

    public function fetchLatestPostsByType($type, $limit) {
        $select = new Select($this->table);
        $select
            ->limit($limit)
            ->join('directus_social_feeds', 'directus_social_posts.feed = directus_social_feeds.id', array('feed_type' => 'type'))
            ->order('datetime DESC');
        $select->where->equalTo('directus_social_feeds.type', $type);
        return $this->selectWith($select);
    }

}
