<?php

namespace Directus\Db\TableGateway;

use Directus\Acl\Acl;
use Directus\Social\Cache as SocialCache;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Where;

class DirectusSocialFeedsTableGateway extends AclAwareTableGateway
{

    public static $_tableName = 'directus_social_feeds';

    const TYPE_TWITTER = 1;
    const TYPE_INSTAGRAM = 2;

    public function __construct(Acl $acl, AdapterInterface $adapter)
    {
        parent::__construct($acl, self::$_tableName, $adapter);
    }

    public function getFeedByHandleAndType($handle, $type)
    {
        $select = new Select($this->getTable());
        $select->limit(1);
        $select
            ->where
            ->equalTo('name', $handle)
            ->equalTo('type', $type);
        $rowset = $this->selectWith($select);
        return $rowset->current();
    }

    public function fetchFeedsById($feeds)
    {
        $socialFeedsById = array();
        $select = new Select(self::$_tableName);
        $FeedWhere = new Where;
        $SocialCache = new SocialCache();
        foreach ($feeds as $feed) {
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
        $select->where($FeedWhere);
        $socialFeeds = $this->selectWith($select);
        $socialFeeds = $socialFeeds->toArray();
        // Store feeds by ID
        foreach ($socialFeeds as &$feed) {
            $feed['data'] = json_decode($feed['data'], true);
            $socialFeedsById[$feed['id']] = $feed;
        }
        return $socialFeedsById;
    }

}
