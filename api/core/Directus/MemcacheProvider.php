<?php
/**
 * User: sdotz
 * Date: 1/9/14
 * Time: 10:46 AM
 */

namespace Directus;

use \Memcache;

/**
 * Class MemcacheProvider
 * @package Directus
 * Wraps the standard memcache methods to provide namespacing between branches/databases (namespace set in directus config-- untracked)
 */
class MemcacheProvider {

    protected static $MEMCACHED_ENABLED = true;
    /**
     * Adds localhost memcached server only
     */
    protected static $LOCAL = false;
    /**
     * Default expire time for cache if not passes into a cache setter method
     */
    const DEFAULT_CACHE_EXPIRE_SECONDS = 300;

    private $memcachedServerAddresses = array(
        'development' => array(
            '10.209.128.55' //cloud-8
        ),
        'production' => array(
            '10.209.133.36', //cloud-5
            '10.209.132.172', //cloud-6
            '10.176.98.151', //cloud-3
            '10.209.130.18' //cloud-4
        )
    );

    /**
     * @var bool
     */
    private $mc = false;

    /**
     * Instantiates memcache only if the extension is loaded and adds server(s) to the pool
     */
    public function __construct(){

        if(isset($_SERVER['SERVER_NAME'])) {
            if(false !== strpos($_SERVER['SERVER_NAME'], 'localhost')) {
                self::$MEMCACHED_ENABLED = false;
            }
        }

        if (extension_loaded('memcache') && self::$MEMCACHED_ENABLED){
            $this->mc = new Memcache();
            if (self::$LOCAL){
                $this->mc->addServer('127.0.0.1', 11211);
            }
            else {
                $servers = $this->memcachedServerAddresses[SOULCYCLE_ENV];
                foreach ($servers as $s){
                    $this->mc->addserver($s, 11211);
                }
            }
        }
        else {
            $this->mc = false;
        }
    }

    /**
     * Set the cache
     *
     * @param $key
     * @param $val
     * @param $compressionFlag
     * @param $expire - seconds to expire in
     * @return bool - success/fail
     */
    public function set($key, $val, $compressionFlag,  $expire = self::DEFAULT_CACHE_EXPIRE_SECONDS){
        if($this->mc) {
            $setSuccess = $this->mc->set($key, $val, $compressionFlag,  $expire);
            return $setSuccess;
        }
    }

    /**
     * Get from the cache
     *
     * @param $key
     * @return mixed - Cache return data, or false if nothing retrieved from cache
     */
    public function get($key){
        if($this->mc) {
            $cacheReturn = $this->mc->get($key);
            return $cacheReturn;
        }
    }

    /**
     * The main method for usage, attempts to retrieve value for a given key, else calls given anonymous
     * function and caches the result at the given key, and returns the retval of anonymous function
     *
     * @param string $key - Key to look up in cache
     * @param callable $functionReturningVal - Anonymous function to call, cache, and return retval unless retreived from memcached
     * @param int $expire - Key expire time in seconds, or can be set to a specific time by providing a unix timestamp
     * @return mixed - Returns retrieved data from cache or else returns the return value of passed-in anonymous function
     *
     */
    public function getOrCache($key, $functionReturningVal, $expire = self::DEFAULT_CACHE_EXPIRE_SECONDS){
        if ($this->mc && $this->mc->getStats()){
            $key = MEMCACHED_ENV_NAMESPACE . '/' . $key;
            $cacheReturn = $this->get($key);
            if (!$cacheReturn){
                $val = $functionReturningVal();
                $this->set($key, $val, MEMCACHE_COMPRESSED, $expire);
                return $val;
            }
            return $cacheReturn;
        }
        return $functionReturningVal();
    }

    /**
     * @param $key - Key to delete
     * @return bool - success or fail
     */
    public function delete($key){
        if ($this->mc && $this->mc->getStats()){
            $key = MEMCACHED_ENV_NAMESPACE . '/' . $key;
            return $this->mc->delete($key);
        }
        return false;
    }

    /**
     * Flushes the entire cache on the server (e.g. cloud-1, cloud-2, cloud-3 for ALL environments)
     *
     * @return bool - success or fail
     */
    public function flush(){
        if ($this->mc && $this->mc->getStats()){
            return $this->mc->flush();
        }
        return false;
    }

    /**
     * Shortcut for appending to a cached array.
     */
    public function appendToEntry($cacheKey, $value, $expire = self::DEFAULT_CACHE_EXPIRE_SECONDS) {
        $set = array($value);
        $entry = $this->get($cacheKey);
        if($entry) {
            $set = $entry;
            $set[] = $value;
        }
        return $this->set($cacheKey, $set, MEMCACHE_COMPRESSED, $expire);
    }

    /**
     * Shortcut for deleting all keys within a namespace key
     */
    public function deleteNamespaceKeys($namespaceKey) {
        $keys = $this->get($namespaceKey);
        if($keys) {
            foreach($keys as $key) {
                $this->delete($key);
            }
            return true;
        }
        return false;
    }

    /**
     * Static key generation functions provided to enforce key consistency throughout
     * application and also serve as documentation of keys in use.
     *
     * @param $classId
     * @return string
     */
    public static function getKeyDirectusUserFind($userId) {
        return "directus_users?user_id=$userId";
    }
    public static function getKeyWebappRoomMap($classId){
        return "class_reservations_arranged_by_seat_id?class_id=$classId";
    }
    public static function getKeyBookerRoomMap($classId){
        return "manager_room_map_data?class_id=$classId";
    }
    public static function getKeyShopCategories($categories){
        return "shop/categories/$categories";
    }
    public static function getKeyShopIndex(){
        return 'shop';
    }
    public static function getKeyInstructors($regionId){
        return "instructors?region_id=$regionId";
    }
    public static function getKeyStudios($regionId){
        return "studios?region_id=$regionId";
    }
    public static function getKeyCommunityIndex(){
        return 'community';
    }
    public static function getKeyRegionsById(){
        return 'regions_by_id';
    }
    public static function getKeySubRegionsByRegion(){
        return 'sub_regions_by_region';
    }
    public static function getKeyCommunityCategories(){
        return 'community_categories';
    }
    public static function getKeyStudiosByRegion(){
        return 'studios_by_region';
    }
    public static function getKeyDirectusTables() {
        return 'directus_tables';
    }
    public static function getKeyDirectusGroupPrivileges($userId) {
        return "directus_group_privileges?group_id=$userId";
    }
    public static function getKeySeriesDataByRiderId($riderId){
        return "series_data_by_rider_id?rider_id=$riderId";
    }
    public static function getKeyInstructorDetail($id){
        return "instructor_detail?instructor_id=$id";
    }
    public static function getKeyInstructorRecord($id){
        return "instructor_record?instructor_id=$id";
    }
    public static function getKeyStudioRandomInstructors($studioId){
        return "studio_random_instructors?studio_id=$studioId";
    }
    public static function getKeyDirectusStorageAdapters(){
        return 'directus_storage_adapters';
    }
    public static function getKeyStudioDetail($studioId){
        return "studio_detail?studio_id=$studioId";
    }
    public static function getKeyRiderRecord($riderId){
        return "rider_record?rider_id=$riderId";
    }
    public static function getKeySeriesMetadataBySeriesId($seriesId){
        return "series_metadata_by_series_id?series_id=$seriesId";
    }
    public static function getKeySeriesMetadataBySeriesSku($seriesSku){
        return "series_metadata_by_series_sku?series_sku=$seriesSku";
    }
    public static function getKeyRiderSeriesMetadata($riderId){
        return "rider_series_metadata?rider_id=$riderId";
    }
    public static function getKeyNonEmptyRiderSeries($riderId){
        return "non_empty_rider_series?rider_id=$riderId";
    }
    public static function getKeyRiderSeriesByRegion($riderId, $includeNonWebBookable){
        return "rider_series_by_region?rider_id=$riderId&include_non_web_bookable=" . ($includeNonWebBookable?"true":"false");
    }
    public static function getKeyProductPhysicalRecord($id) {
        return "product_physical?id=$id";
    }
    public static function getKeyGiftCardLogicalProduct() {
        return "gift_card_logical_product";
    }
    public static function getKeyCartFetchByRiderAndStudio($riderId, $studioId) {
        return "cart_fetch_by_rider_and_studio?rider_id=$riderId&studio_id=$studioId";
    }
    public static function getKeyCartQuantityByRiderAndStudio($riderId, $studioId) {
        return "cart_quantity_by_rider_and_studio?rider_id=$riderId&studio_id=$studioId";
    }
    public static function getKeyClassesByStudioAndDateRange($studioId, $dateStart, $dateEnd, $webAppVisibleClassesOnly){
        return "classes_by_studio_and_day?studio_id=$studioId&date_start=$dateStart&date_end=$dateEnd&web_app_visible_classes_only=$webAppVisibleClassesOnly";
    }
    public static function getKeyUpcomingByStudio($studioId, $studioTz, $limit, $webAppVisOnly){
        return "upcoming_by_studio?studio_id=$studioId&studio_tz=$studioTz&limit=$limit&web_app_viz=$webAppVisOnly";
    }
    public static function getKeyUpcomingByInstructor($instructorId, $limit, $webAppVisOnly){
        return "upcoming_by_instructor?instructor_id=$instructorId&limit=$limit&web_app_viz=$webAppVisOnly";
    }
    public static function getKeySocialDataByInstructorId($instructorId) {
        return "instructor_social_data?instructor_id=$instructorId";
    }
    public static function getKeyRoomsWithStudioTitles($roomIds) {
        return "rooms_with_studio_titles?room_ids=" . implode(',', $roomIds);
    }
    public static function getKeyResolvedProductsByLogicalIds($logicalIds) {
        return "resolved_products_by_logical_ids?logical_ids=" . implode(',', $logicalIds);
    }
    public static function getNamespaceResolvedProductsByLogicalIds() {
        return "namespace_resolved_products_by_logical_ids";
    }
    public static function getKeyCommunityDetail($id) {
        return "community_detail?id=$id";
    }
    public static function getKeyCommunityComments($id) {
        return "community_coomments?id=$id";
    }
    public static function getKeyRiderBookmarkClassIds($riderId) {
        return "rider_bookmark_class_ids?rider_id=$riderId";
    }
    public static function getKeyRiderFavoriteInstructorIds($riderId) {
        return "rider_favorite_instructor_ids?rider_id=$riderId";
    }
    public static function getKeyUpcomingByInstructorGroupByDate($instructorId, $userId, $webAppVisibleClassesOnly){
        return "upcoming_classes_by_instrutor_grouped_by_date?instructor_id=$instructorId&user_id=$userId&webapp_viz=$webAppVisibleClassesOnly";
    }
    public static function getKeyDirectusGroupSchema($userGroupId, $versionHash){
        return "directus_schema_by_group_and_version?group_id=$userGroupId&version=$versionHash";
    }
    public static function getKeyUpcomingRiderBookmarks($riderId){
        return "upcoming_rider_bookmarks?rider_id=$riderId";
    }
    public static function getKeyMeSeriesForRider($riderId){
        return "me_series_for_rider?rider_id=$riderId";
    }
    public static function getKeyFetchUpcomingBookmarksByRider($riderId){
        return "fetch_upcoming_bookmarks_by_rider?rider_id=$riderId";
    }
    public static function getKeyRiderHistoryIncludingCancellations($riderId, $includeMissedSoul){
        return "series_api_rider_history_including_cancellations?rider_id=$riderId&includeMissedSoul=" . ($includeMissedSoul ? '1' : '0');
    }
    public static function getKeyUrlMap() {
        return "url_map";
    }
    public static function getKeyStudioById($id){
        return "studio_by_id?studio_id=$id";
    }
    public static function getKeyStudioWithRegionByClassId($classId){
        return "studio_with_region_by_class_id?class_id=$classId";
    }
    public static function getKeyStudioByRoom($roomId){
        return "studio_by_room?room_id=$roomId";
    }
    public static function getKeyClassById($id, $webAppVisibleClassesOnly){
        return "class_by_id?class_id=$id&webAppClassesOnly=" . ($webAppVisibleClassesOnly?"1":"0");
    }
    public static function getKeyClassTypeById($id){
        return "class_type_by_id?class_type_id=$id";
    }
    public static function getKeySeatById($id){
        return "seat_by_id?seat_id=$id";
    }
    public static function getKeySeatQuantityByClass($id) {
        return "seat_quantity_by_class?class_id=$id";
    }
    public static function getKeyFetchUpcomingReservationsByRider($riderId){
        return "fetch_upcoming_reservations_by_rider?rider_id=$riderId";
    }
    public static function getKeyFetchAllSeriesWithIdKeys(){
        return "fetch_all_series_with_id_keys";
    }
    public static function getKeyFetchAllRegionClassSeries(){
        return "fetch_all_region_class_series";
    }
    public static function getKeySplashImage() {
        return "homepage_splash_image";
    }
    public static function getKeyLargeSplashImage() {
        return "homepage_large_splash_image";
    }
    public static function getKeyRiderFavoriteStudios($riderId) {
        return "rider_favorite_studio_ids?rider_id=$riderId";
    }
    public static function getKeyDirectusCountMessages($uid) {
        return "directus_count_messages?uid=$uid";
    }
    public static function getKeyDirectusMessagesNewerThan($maxId, $uid) {
        return "directus_get_messages_newer_than?uid=$uid&maxId=$maxId";
    }
}