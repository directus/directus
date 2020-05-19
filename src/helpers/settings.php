<?php

namespace Directus;

use Directus\Application\Application;
use Directus\Database\TableGateway\RelationalTableGateway;
use Directus\Database\TableGatewayFactory;
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
            'asset_whitelist',
            'asset_whitelist_system'
        ]);
    }
}

if (!function_exists('get_directus_proxy_downloads_settings')) {
    /**
     * Get all directus files settings
     *
     * @return array
     */
    function get_directus_proxy_downloads_settings()
    {
        return get_directus_settings_by_keys([
            'proxy_downloads_not_found_location',
            'proxy_downloads_cache_ttl',
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

if (!function_exists('get_project_info')) {
    /**
     * Returns the project information
     *
     * @return array
     */
    function get_project_info()
    {
        $settings = get_directus_settings_by_keys([
            'project_name',
            'project_logo',
            'project_color',
            'project_foreground',
            'project_background',
            'project_public_note',
            'default_locale',
            'telemetry'
        ]);

        // TODO:
        // Typecasting of these values should be done the same way as in the `/settings` endpoint.

        $settings['project_logo'] = array_get($settings, 'project_logo')
            ? get_file_data(array_get($settings, 'project_logo'))
            : null;

        $settings['project_foreground'] =
            array_get($settings, 'project_foreground')
            ? get_file_data(array_get($settings, 'project_foreground'))
            : null;

        $settings['project_background'] =
            array_get($settings, 'project_background')
            ? get_file_data(array_get($settings, 'project_background'))
            : null;

        $settings['project_public_note'] =
            array_get($settings, 'project_public_note')
            ? array_get($settings, 'project_public_note')
            : null;

        $settings['telemetry'] =
            array_get($settings, 'telemetry') && $settings['telemetry']
            ? true
            : false;

        return $settings;
    }
}

if (!function_exists('get_file_data')) {
    /**
     * @param int $id
     *
     * @return array
     */
    function get_file_data($id)
    {
        /** @var RelationalTableGateway $table */
        $table = TableGatewayFactory::create('directus_files', ['acl' => false]);

        try {
            $result = $table->getItemsByIds($id, ['fields' => 'data']);
            $data = array_get($result, 'data.data', []);
        } catch (\Exception $e) {
            $data = null;
        }

        if ($data) {
            $data = array_pick($data, ['full_url', 'url', 'asset_url']);
        }

        return $data;
    }
}
