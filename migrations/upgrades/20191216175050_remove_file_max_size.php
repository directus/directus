<?php


use Phinx\Migration\AbstractMigration;

class RemoveFileMaxSize extends AbstractMigration
{

    public function change()
    {
        // -------------------------------------------------------------------------
        // Remove file_max_size setting field
        // -------------------------------------------------------------------------
        if ($this->checkFieldExist('directus_settings', 'file_max_size')) {
            $this->removeField('directus_settings', 'file_max_size');
        }

        $this->removeSetting('file_max_size');

        // -------------------------------------------------------------------------
        // Update the sorting order
        // -------------------------------------------------------------------------
        if ($this->checkFieldExist('directus_settings', 'file_mimetype_whitelist')) {
            $this->execute(\Directus\phinx_update(
                $this->getAdapter(),
                'directus_fields',
                [
                    'sort' => 32,
                    'width' => 'half'
                ],
                ['collection' => 'directus_settings', 'field' => 'file_mimetype_whitelist']
            ));
        }

        if ($this->checkFieldExist('directus_settings', 'asset_whitelist')) {
            $this->execute(\Directus\phinx_update(
                $this->getAdapter(),
                'directus_fields',
                [
                    'sort' => 33
                ],
                ['collection' => 'directus_settings', 'field' => 'asset_whitelist']
            ));
        }

        if ($this->checkFieldExist('directus_settings', 'asset_whitelist_system')) {
            $this->execute(\Directus\phinx_update(
                $this->getAdapter(),
                'directus_fields',
                [
                    'sort' => 34
                ],
                ['collection' => 'directus_settings', 'field' => 'asset_whitelist_system']
            ));
        }

        if ($this->checkFieldExist('directus_settings', 'youtube_api_key')) {
            $this->execute(\Directus\phinx_update(
                $this->getAdapter(),
                'directus_fields',
                [
                    'sort' => 35
                ],
                ['collection' => 'directus_settings', 'field' => 'youtube_api_key']
            ));
        }
    }


    public function checkFieldExist($collection, $field)
    {
        $checkSql = sprintf('SELECT 1 FROM `directus_fields` WHERE `collection` = "%s" AND `field` = "%s";', $collection, $field);
        return $this->query($checkSql)->fetch();
    }

    public function removeField($collection, $field)
    {
        $this->execute('DELETE FROM `directus_fields` WHERE `collection` = "' . $collection . '" and `field` = "' . $field . '";');
    }

    public function hasSetting($field)
    {
        $checkSql = sprintf('SELECT 1 FROM `directus_settings` WHERE `key` = "%s"', $field);
        return $this->query($checkSql)->fetch();
    }

    public function removeSetting($field)
    {
        if ($this->hasSetting($field)) {
            $this->execute('DELETE FROM `directus_settings` where `key` = "' . $field . '";');
        }
    }
}
