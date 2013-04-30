<?php

namespace Directus\Social;

use Directus\Bootstrap;
use Directus\Db\TableGateway\DirectusSocialFeedsTableGateway;
use Directus\Db\TableGateway\DirectusSocialPostsTableGateway;
use Zend\Db\Sql\Expression;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\Select;

class Cache {

    public static $scrape_interval_seconds = 300; // 5 min

    public function __construct() {
        $aclProvider = Bootstrap::get('aclProvider');
        $ZendDb = Bootstrap::get('ZendDb');
        $this->SocialFeedsTableGateway = new DirectusSocialFeedsTableGateway($aclProvider, $ZendDb);
        $this->SocialPostsTableGateway = new DirectusSocialPostsTableGateway($aclProvider, $ZendDb);
    }

    public function scrapeFeedsIfDue() {
        $dueFeeds = $this->getDueFeeds();
        foreach($dueFeeds as $feed) {
            // die(var_dump($feed->toArray()));
            $this->scrapeFeed($feed->toArray());
        }
    }

    private function getDueFeeds() {
        $due = time() - self::$scrape_interval_seconds;
        $due = date("c", $due);
        $select = new Select($this->SocialFeedsTableGateway->getTable());
        $select
            ->where
                ->lessThanOrEqualTo('last_checked', $due)
                ->or
                ->isNull('last_checked');
        return $this->SocialFeedsTableGateway->selectWith($select);
    }

    private function scrapeFeed(array $feed) {
        switch($feed['type']) {
            case DirectusSocialFeedsTableGateway::TYPE_TWITTER:
                $updatedFeed = $this->scrapeTwitterFeed($feed);
                break;
            case DirectusSocialFeedsTableGateway::TYPE_INSTAGRAM:
                // ...
                return;
                break;
        }
        // Update feed's last_checked value
        $set = array('last_checked' => new Expression('NOW()'));
        $where = array('id' => $feed['id']);
        if($updatedFeed['data'] !== $feed['data'])
            $set['data'] = $updatedFeed['data'];
        $this->SocialFeedsTableGateway->update($set, $where);
    }

    private function scrapeTwitterFeed(array $feed) {
        // die(var_dump($feed));
        $cb = Bootstrap::get('codebird');
        $statuses = (array) $cb->statuses_userTimeline(array('screen_name' => $feed['name']));
        // var_dump((array) $statuses);exit;
        $httpStatus = $statuses['httpstatus'];
        unset($statuses['httpstatus']);
        foreach($statuses as $status) {
            $status = (array) $status;
            unset($status['user']);
            $cachedCopy = $this->SocialPostsTableGateway->feedForeignIdExists($status['id'], $feed['id']);
            if($cachedCopy) {
                // Exists in cache. Does the data need updating?
                $this->updateFeedEntryDataIfNewer($feed, $cachedCopy, $status);
            } else {
                // Never cached. Cache it.
                $published = new \DateTime($status['created_at']);
                $this->newFeedEntry($feed, $status, $published);
            }
        }
        // Update feed user data
        $sampleEntry = (array) $statuses[0];
        $feed['data'] = json_encode($sampleEntry['user']);
        return $feed;
    }

    /**
     * If the data of the feed entry has changed since the cached copy was stored, update the data contained in the
     * cached copy.
     * @param  array  $feed  Array representation of the feed. Needs 'id' key.
     * @param  array|DirectusSocialPostRowGateway $cachedEntry
     * @param  array|object  $newEntryData API response record object/array.
     * @return void
     */
    private function updateFeedEntryDataIfNewer(array $feed, $cachedEntry, $newEntryData) {
        if(!is_array($newEntryData))
            $newEntryData = (array) $newEntryData;
        $newEntryData = json_encode($newEntryData);
        if($newEntryData !== $cachedEntry['data']) {
            $set = array('data' => $newEntryData);
            $where = array(
                'foreign_id' => $cachedEntry['foreign_id'],
                'feed' => $feed['id']
            );
            $this->SocialPostsTableGateway->update($set, $where);
        }
    }

    private function newFeedEntry(array $feed, $newEntryData, \DateTime $published) {
        if(!is_array($newEntryData))
            $newEntryData = (array) $newEntryData;
        $entryAsJson = json_encode($newEntryData);
        return $this->SocialPostsTableGateway->insert(array(
            'feed' => $feed['id'],
            'published' => $published->format('c'),
            'foreign_id' => $newEntryData['id'],
            'data' => $entryAsJson
        ));
    }

}