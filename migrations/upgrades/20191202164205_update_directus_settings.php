<?php

use Phinx\Migration\AbstractMigration;

class UpdateDirectusSettings extends AbstractMigration
{
    public function change()
    {
        $settingsTable = $this->table('directus_settings');

        // -------------------------------------------------------------------------
        // Remove deprecated setting fields
        // -------------------------------------------------------------------------
        $this->removeSetting('color');
        $this->removeSetting('thumbnail_dimensions');
        $this->removeSetting('thumbnail_quality_tags');
        $this->removeSetting('thumbnail_actions');
        $this->removeSetting('thumbnail_cache_ttl');
        $this->removeSetting('thumbnail_not_found_location');

        // -------------------------------------------------------------------------
        // Rename logo to project_logo
        // -------------------------------------------------------------------------
        if ($this->hasSetting('logo')) {
            $this->execute(\Directus\phinx_update(
                $this->getAdapter(),
                'directus_settings',
                ['key' => 'project_logo'],
                ['key' => 'logo']
            ));
        }

        // -------------------------------------------------------------------------
        // Add new setting fields
        // -------------------------------------------------------------------------
        $newSettings = [
            [
                'key' => 'project_url',
                'value' => '',
            ],
            [
                'key' => 'project_color',
                'value' => '#13181a',
            ],
            [
                'key' => 'project_foreground',
                'value' => '',
            ],
            [
                'key' => 'project_background',
                'value' => '',
            ],
            [
                'key' => 'default_locale',
                'value' => NULL,
            ],
            [
                'key' => 'telemetry',
                'value' => '1'
            ],
            [
                'key' => 'password_policy',
                'value' => ''
            ],
            [
                'key' => 'login_attempts_allowed',
                'value' => ''
            ],
            [
                'key' => 'file_mimetype_whitelist',
                'value' => ''
            ],
            [
                'key' => 'asset_whitelist_system',
                'value' => json_encode([
                    [
                        "key" => "card",
                        "width" => 200,
                        "height" => 200,
                        "fit" => "crop",
                        "quality" => 80
                    ],
                    [
                        "key" => "avatar",
                        "width" => 100,
                        "height" => 100,
                        "fit" => "crop",
                        "quality" => 80
                    ]
                ])
            ],
            [
                'key' => 'asset_whitelist',
                'value' => json_encode([
                    [
                        "key" => "thumbnail",
                        "width" => 200,
                        "height" => 200,
                        "fit" => "contain",
                        "quality" => 80
                    ]
                ])
            ]
        ];

        foreach ($newSettings as $setting) {
            if ($this->hasSetting($setting['key']) == false) {
                $settingsTable->insert($setting);
            }
        }

        // -------------------------------------------------------------------------
        // Save the changes
        // -------------------------------------------------------------------------
        $settingsTable->save();
    }

    public function hasSetting($field)
    {
        $checkSql = sprintf('SELECT 1 FROM `directus_settings` WHERE `key` = "%s"', $field);
        return $this->query($checkSql)->fetch();
    }

    public function removeSetting($field)
    {
        if (!$this->hasSetting($field)) {
            $this->execute('DELETE FROM `directus_settings` where `key` = "' . $field . '";');
        }
    }
}
