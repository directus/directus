<?php


use Phinx\Migration\AbstractMigration;

class AddAssetURLNamingSetting extends AbstractMigration
{
    public function change()
    {
        $fieldsTable = $this->table('directus_fields');
        $settingsTable = $this->table('directus_settings');

        if (!$this->checkFieldExist('directus_settings', 'asset_url_naming')) {
            $fieldsTable->insert([
                'collection' => 'directus_settings',
                'field' => 'asset_url_naming',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'dropdown',
                'locked' => 1,
                'sort' => 32,
                'width' => 'half',
                'note' => 'Thumbnail URL convention',
                'options' => json_encode([
                    'choices' => [
                        'private_hash' => 'Private Hash (Obfuscated)',
                        'filename_download' => 'File Name (Readable)'
                    ]
                ])
            ])->save();
        }

        if ($this->checkFieldExist('directus_settings', 'file_mimetype_whitelist')) {
            $this->execute(\Directus\phinx_update(
                $this->getAdapter(),
                'directus_fields',
                [
                    'sort' => 33
                ],
                ['collection' => 'directus_settings', 'field' => 'file_mimetype_whitelist']
            ));
        }

        if ($this->checkFieldExist('directus_settings', 'asset_whitelist')) {
            $this->execute(\Directus\phinx_update(
                $this->getAdapter(),
                'directus_fields',
                [
                    'sort' => 34
                ],
                ['collection' => 'directus_settings', 'field' => 'asset_whitelist']
            ));
        }

        if ($this->checkFieldExist('directus_settings', 'asset_whitelist_system')) {
            $this->execute(\Directus\phinx_update(
                $this->getAdapter(),
                'directus_fields',
                [
                    'sort' => 35
                ],
                ['collection' => 'directus_settings', 'field' => 'asset_whitelist_system']
            ));
        }

        if ($this->checkFieldExist('directus_settings', 'youtube_api_key')) {
            $this->execute(\Directus\phinx_update(
                $this->getAdapter(),
                'directus_fields',
                [
                    'sort' => 36
                ],
                ['collection' => 'directus_settings', 'field' => 'youtube_api_key']
            ));
        }

        // -------------------------------------------------------------------------
        // Add new setting fields
        // -------------------------------------------------------------------------
        $newSettings = [
            [
                'key' => 'asset_url_naming',
                'value' => 'private_hash'
            ],
        ];

        foreach ($newSettings as $setting) {
            if ($this->hasSetting($setting['key']) == false) {
                $settingsTable->insert($setting);
            }
        }

        // -------------------------------------------------------------------------
        // Save the changes
        // -------------------------------------------------------------------------
        $fieldsTable->save();
        $settingsTable->save();
    }

    public function checkFieldExist($collection, $field)
    {
        $checkSql = sprintf('SELECT 1 FROM `directus_fields` WHERE `collection` = "%s" AND `field` = "%s";', $collection, $field);
        return $this->query($checkSql)->fetch();
    }

    public function hasSetting($field)
    {
        $checkSql = sprintf('SELECT 1 FROM `directus_settings` WHERE `key` = "%s"', $field);
        return $this->query($checkSql)->fetch();
    }
}
