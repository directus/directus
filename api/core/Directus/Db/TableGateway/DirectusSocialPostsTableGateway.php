<?php

namespace Directus\Db\TableGateway;

use Directus\Acl\Acl;
use Directus\Db\TableGateway\AclAwareTableGateway;
use Directus\Social\Cache as SocialCache;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Predicate\NotIn;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Update;
use Zend\Db\Sql\Where;

class DirectusSocialPostsTableGateway extends AclAwareTableGateway {

    public static $_tableName = "directus_social_posts";

    public function __construct(Acl $acl, AdapterInterface $adapter) {
        parent::__construct($acl, self::$_tableName, $adapter);
    }

    public function feedForeignIdExists($foreign_id, $feed_id) {
        $select = new Select($this->table);
        $select
            ->limit(1)
            ->where
                ->equalTo('foreign_id', $foreign_id)
                ->equalTo('feed', $feed_id);
        $result = $this->selectWith($select);
        $result = $result->current();
        return $result;
    }

    public function fetchLatestPostsByHandleAndType($handle, $type, $limit) {
        $select = new Select($this->table);
        $select
            ->limit($limit)
            ->join('directus_social_feeds', 'directus_social_posts.feed = directus_social_feeds.id', array('feed_type' => 'type'))
            ->order('datetime DESC');
        $select
            ->where
                ->equalTo('directus_social_posts.status', 1)
                ->equalTo('directus_social_feeds.status', 1)
                ->equalTo('directus_social_feeds.type', $type)
                ->equalTo('directus_social_feeds.name', $handle);
        return $this->selectWith($select);
    }

    public function fetchPostsByFeeds($feeds, $offset = null, $limit = null) {
        $select = new Select(self::$_tableName);
        if(!is_null($offset)) {
            $select->offset($offset);
        }
        if(!is_null($limit)) {
            $select->limit($limit);
        }
        $select
            ->join('directus_social_feeds', 'directus_social_feeds.id = directus_social_posts.feed', array('feed_type' => 'type'))
            ->order('directus_social_posts.datetime DESC');
        $select
            ->where
                ->equalTo('directus_social_posts.status', 1)
                ->equalTo('directus_social_feeds.status', 1);
        $FeedWhere = new Where;
        $SocialCache = new SocialCache();
        foreach($feeds as $feed) {
            // Run scrape if due
            $SocialCache->scrapeFeedIfDue($feed['name'], $feed['type']);
            $FeedWhere
                ->or
                ->nest
                    ->equalTo('directus_social_feeds.name', $feed['name'])
                    ->equalTo('directus_social_feeds.type', $feed['type'])
                ->unnest;
            $select->where($FeedWhere);
        }
        $socialPosts = $this->selectWith($select);
        $socialPosts = $socialPosts->toArray();
        // Unserialize cached feed entry API-responses
        foreach($socialPosts as &$post) {
            $post['data'] = json_decode($post['data'], true);
        }
        return $socialPosts;
    }

    public function deleteOtherFeedPosts($feedId, array $postIds) {
        $Update = new Update(self::$_tableName);
        $Update
            ->set(array(STATUS_COLUMN_NAME => 0));
        $Update
            ->where
                ->addPredicate(new NotIn('foreign_id', $postIds))
                ->equalTo('feed', $feedId);
        $affectedRows = $this->updateWith($Update);
        return $affectedRows;
    }

    public function fetchLimitedPosts($perPage, $offset) {
        $select = new Select(self::$_tableName);
        $select->order('datetime DESC')
               ->limit($perPage)
               ->offset($offset);

        $socialPosts = $this->selectWith($select);
        $socialPosts = $socialPosts->toArray();
        // Unserialize cached feed entry API-responses
        foreach($socialPosts as &$post) {
            $post['data'] = json_decode($post['data'], true);
        }
        return $socialPosts;
    }

    // public function fetchLatestPostsByType($type, $limit) {
    //     $select = new Select($this->table);
    //     $select
    //         ->limit($limit)
    //         ->join('directus_social_feeds', 'directus_social_posts.feed = directus_social_feeds.id', array('feed_type' => 'type'))
    //         ->order('datetime DESC');
    //     $select->where->equalTo('directus_social_feeds.type', $type);
    //     return $this->selectWith($select);
    // }

}
