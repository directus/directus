<?php

use Phinx\Migration\AbstractMigration;

class AddMissingSettingsField extends AbstractMigration
{
    public function up()
    {
        $settings = [
            'project_name' => [
                'type' => 'string',
                'interface' => 'text-input',
            ],
            'default_limit' => [
                'type' => 'integer',
                'interface' => 'numeric',
            ],
            'sort_null_last' => [
                'type' => 'boolean',
                'interface' => 'switch',
            ],
            'auto_sign_out' => [
                'type' => 'integer',
                'interface' => 'numeric',
            ],
            'youtube_api' => [
                'type' => 'string',
                'interface' => 'text-input',
            ],
            'thumbnail_dimensions' => [
                'type' => 'array',
                'interface' => 'tags',
            ],
            'thumbnail_quality_tags' => [
                'type' => 'json',
                'interface' => 'code',
            ],
            'thumbnail_actions' => [
                'type' => 'json',
                'interface' => 'code',
            ],
            'thumbnail_cache_ttl' => [
                'type' => 'integer',
                'interface' => 'numeric',
            ],
            'thumbnail_not_found_location' => [
                'type' => 'string',
                'interface' => 'text-input',
            ],
        ];

        foreach ($settings as $field => $options) {
            $this->addField($field, $options['type'], $options['interface']);
        }
    }

    protected function addField($field, $type, $interface)
    {
        $collection = 'directus_settings';
        $checkSql = sprintf('SELECT 1 FROM `directus_fields` WHERE `collection` = "%s" AND `field` = "%s";', $collection, $field);
        $result = $this->query($checkSql)->fetch();

        if (!$result) {
            $insertSqlFormat = 'INSERT INTO `directus_fields` (`collection`, `field`, `type`, `interface`) VALUES ("%s", "%s", "%s", "%s");';
            $insertSql = sprintf($insertSqlFormat, $collection, $field, $type, $interface);
            $this->execute($insertSql);
        }
    }
}
