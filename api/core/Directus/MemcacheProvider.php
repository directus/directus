<?php
/**
 * User: sdotz
 * Date: 1/9/14
 * Time: 10:46 AM
 */

namespace Directus;

use \Memcache;

class MemcacheProvider {

    const MEMCACHED_SERVER_CLOUD_1 = '166.78.77.0';
    const MEMCACHED_SERVER_CLOUD_2 = '166.78.77.1';
    const MEMCACHED_SERVER_CLOUD_3 = '166.78.77.2';
    const DISTRIBUTED = false;
    const DEFAULT_CACHE_EXPIRE_SECONDS = 300;

    private $mc;

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
            //$this->memcache->setCompressThreshold(100000);
        }
        else {
            $this->mc = false;
        }
    }

    public function set($key, $val, $compressionFlag,  $expire){
        if ($this->mc) {
            $setSuccess = $this->mc->set($key, $val, $compressionFlag,  $expire);
            return $setSuccess;
        }
    }

    public function get($key){
        if ($this->mc) {
            $cacheReturn = $this->mc->get($key);
            return $cacheReturn;
        }

    }

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

    public function delete($key){
        if ($this->mc){
            $key = MEMCACHED_ENV_NAMESPACE . '/' . $key;
            return $this->mc->delete($key);
        }
        return false;
    }

    public function flush(){
        if ($this->mc){
            return $this->mc->flush();
        }
        return false;
    }

    //Key returning functions
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
        return "shop";
    }
    public static function getKeyInstructors(){
        return "instructors";
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
    public static function getKeySeriesDataByRiderId($riderId){
        return "series_data_by_rider_id?rider_id=$riderId";
    }
}