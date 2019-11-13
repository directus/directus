<?php


use Phinx\Migration\AbstractMigration;

class RenameSettings extends AbstractMigration
{
    
    public function change()
    {
        // Update the field name in directus_fields collection
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
            'field' => 'project_color'
            ],
            ['collection' => 'directus_settings', 'field' => 'color']
        ));

        // Update the key in directus_settings collection
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_settings',
            [
            'key' => 'project_color'
            ],
            ['key' => 'color']
        ));
    }
}
