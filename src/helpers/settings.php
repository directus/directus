<?php

namespace Directus;

use Directus\Application\Application;
use Directus\Util\StringUtils;

if (!function_exists('get_directus_settings')) {
    /**
     * Returns an array of directus settings
     *
     * @return array
     */
    function get_directus_settings()
    {
        $app = Application::getInstance();

        return $app->getContainer()->get('app_settings');
    }
}

if (!function_exists('get_directus_setting')) {
    /**
     * Returns a directus settings by key
     *
     * @param string $key
     * @param null $default
     *
     * @return mixed
     */
    function get_directus_setting($key, $default = null)
    {
        $settings = get_directus_settings();
        $value = $default;

        foreach ($settings as $setting) {
            if ($setting['key'] == $key) {
                $value = $setting['value'];
                break;
            }
        }

        return $value;
    }
}

if (!function_exists('get_kv_directus_settings')) {
    /**
     * Returns the settings in a key-value format
     *
     * @return array
     */
    function get_kv_directus_settings()
    {
        $settings = get_directus_settings();
        $result = [];

        foreach ($settings as $setting) {
            $result[$setting['key']] = $setting['value'];
        }

        return $result;
    }
}

if (!function_exists('get_directus_files_settings')) {
    /**
     * Get all directus files settings
     *
     * @return array
     */
    function get_directus_files_settings()
    {
        return get_directus_settings_by_keys([
            'file_naming',
            'youtube_api_key',
        ]);
    }
}

if (!function_exists('get_directus_thumbnail_settings')) {
    /**
     * Get all directus files settings
     *
     * @return array
     */
    function get_directus_thumbnail_settings()
    {
        return get_directus_settings_by_keys([
            'thumbnail_dimensions',
            'thumbnail_not_found_location',
            'thumbnail_quality_tags',
            'thumbnail_actions',
            'thumbnail_cache_ttl',
        ]);
    }
}

if (!function_exists('get_directus_settings_by_keys')) {
    /**
     * Get all directus files settings
     *
     * @param array $keys
     *
     * @return array
     */
    function get_directus_settings_by_keys(array $keys)
    {
        $settings = get_directus_settings();
        $filesSettings = [];

        foreach ($settings as $setting) {
            if (in_array($setting['key'], $keys)) {
                $filesSettings[$setting['key']] = $setting['value'];
            }
        }

        return $filesSettings;
    }
}

if (!function_exists('get_trusted_proxies')) {
    /**
     * @return array
     */
    function get_trusted_proxies()
    {
        $trustedProxies = get_directus_setting('trusted_proxies');

        return $trustedProxies ? StringUtils::safeCvs($trustedProxies) : [];
    }
}
