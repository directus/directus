<?php


use Phinx\Migration\AbstractMigration;

class UpdateGeneralSettingVariabeName extends AbstractMigration
{
    /**
     * Change Method.
     *
     * Write your reversible migrations using this method.
     *
     * More information on writing migrations is available here:
     * http://docs.phinx.org/en/latest/migrations.html#the-abstractmigration-class
     *
     * The following commands can be used in this method and Phinx will
     * automatically reverse them when rolling back:
     *
     *    createTable
     *    renameTable
     *    addColumn
     *    renameColumn
     *    addIndex
     *    addForeignKey
     *
     * Remember to call "create()" or "update()" and NOT "save()" when working
     * with the Table class.
     */
    public function change()
    {
        // Rename logo
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'field' => 'project_logo'
            ],
            ['collection' => 'directus_settings', 'field' => 'logo']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_settings',
            [
              'key' => 'project_logo'
            ],
            ['key' => 'logo']
        ));

        // Update the interface of project_icon from icon to file and rename it.
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'field' => 'project_foreground',
              'type' => \Directus\Database\Schema\DataTypes::TYPE_FILE,
              'interface' => 'file'
            ],
            ['collection' => 'directus_settings', 'field' => 'project_icon']
        ));
        
        // Need to delete the project_icon as this migration will change the interface to file and the icon will contain the string
        $result = $this->query('SELECT 1 FROM `directus_settings` WHERE `key` = "project_icon";')->fetch();

        if ($result) {
            $this->execute('DELETE FROM `directus_settings` where `key` = "project_icon";');
        }

        // Rename project_image
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'field' => 'project_background'
            ],
            ['collection' => 'directus_settings', 'field' => 'project_image']
        ));
        
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_settings',
            [
              'key' => 'project_background'
            ],
            ['key' => 'project_image']
        ));

        $result = $this->query('SELECT 1 FROM `directus_fields` WHERE `field` = "app_url";')->fetch();

        if ($result) {
            $this->execute('DELETE FROM `directus_fields` where `field` = "app_url";');
        }

        $result = $this->query('SELECT 1 FROM `directus_settings` WHERE `key` = "app_url";')->fetch();

        if ($result) {
            $this->execute('DELETE FROM `directus_settings` where `key` = "app_url";');
        }
    }
}
