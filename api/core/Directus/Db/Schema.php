<?php
/**
 * This class will replace TableSchema
 */
namespace Directus\Db;


class Schema
{
    public static function getSupportedDatabases()
    {
        return [
            'mysql' => [
                'id' => 'mysql',
                'name' => 'MySQL/Percona'
            ]
        ];
    }

    public static function getTemplates()
    {
        return [
            'ui_gallery' => [
                'id' => 'ui_gallery',
                'name' => 'UI Gallery'
            ]
        ];
    }
}
