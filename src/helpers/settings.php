<?php

namespace Directus;

use Directus\Application\Application;

if (!function_exists('get_directus_settings')) {
    /**
     * Returns an array of directus settings
     *
     * @param string|null $scope
     *
     * @return array
     */
    function get_directus_settings($scope = null)
    {
        $app = Application::getInstance();

        $settings = $app->getContainer()->get('app_settings');

        if ($scope !== null) {
            foreach ($settings as $index => $setting) {
                if ($setting['scope'] !== $scope) {
                    unset($settings[$index]);
                }
            }
        }

        return $settings;
    }
}

if (!function_exists('get_directus_setting')) {
    /**
     * Returns a directus settings by key+scope combo
     *
     * @param string $scope
     * @param string $key
     * @param null $default
     *
     * @return mixed
     */
    function get_directus_setting($scope, $key, $default = null)
    {
        $settings = get_directus_settings();
        $value = $default;

        foreach ($settings as $setting) {
            if ($setting['scope'] == $scope && $setting['key'] == $key) {
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
     * @param null|string $scope
     *
     * @return array
     */
    function get_kv_directus_settings($scope = null)
    {
        $settings = get_directus_settings($scope);
        $result = [];

        foreach ($settings as $setting) {
            $result[$setting['key']] = $setting['value'];
        }

        return $result;
    }
}
