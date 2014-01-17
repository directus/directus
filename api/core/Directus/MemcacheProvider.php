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

    /**
     *  Cloud-1 address
     */
    const MEMCACHED_SERVER_CLOUD_1 = '166.78.77.0';
    /**
     * Cloud-2 address
     */
    const MEMCACHED_SERVER_CLOUD_2 = '166.78.77.1';
    /**
     * Cloud-3 address
     */
    const MEMCACHED_SERVER_CLOUD_3 = '166.78.77.2';
    /**
     * Bool, if true, adds all 3 server addresses for distributed memcached setup rather than local pools per-server
     */
    const DISTRIBUTED = false;
    /**
     * Default expire time for cache if not passes into a cache setter method
     */
    const DEFAULT_CACHE_EXPIRE_SECONDS = 300;

    /**
     * @var bool
     */
    private $mc;

    /**
     * Instantiates memcache only if the extension is loaded and adds server(s) to the pool
     */
    public function __construct(){
        if (extension_loaded('memcache')){
            $this->mc = new Memcache();
            if (!self::DISTRIBUTED){
                $this->mc->addServer(MEMCACHED_SERVER, 11211);
            }
            else {
                $this->mc->addServer(self::MEMCACHED_SERVER_CLOUD_1, 11211);
                $this->mc->addServer(self::MEMCACHED_SERVER_CLOUD_2, 11211);
                $this->mc->addServer(self::MEMCACHED_SERVER_CLOUD_3, 11211);
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
        if ($this->mc) {
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
        if ($this->mc) {
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
        if ($this->mc){
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
        if ($this->mc){
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
        if ($this->mc){
            return $this->mc->flush();
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
    public static function getKeyClassesByStudioAndDay($studioId, $date){
        return "classes_by_studio_and_day?studio_id=$studioId&date=$date";
    }
    public static function getKeyUpcomingByStudio($studioId, $studioTz, $limit, $webAppVisOnly){
        return "upcoming_by_studio?studio_id=$studioId&studio_tz=$studioTz&limit=$limit&web_app_viz=$webAppVisOnly";
    }
}