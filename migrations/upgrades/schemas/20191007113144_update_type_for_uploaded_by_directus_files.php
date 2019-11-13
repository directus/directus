<?php


use Phinx\Migration\AbstractMigration;

class UpdateTypeForUploadedByDirectusFiles extends AbstractMigration
{
    public function change()
    {
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
            'type' => \Directus\Database\Schema\DataTypes::TYPE_USER_CREATED,
            'interface' => 'user-created'
            ],
            ['collection' => 'directus_files', 'field' => 'uploaded_by']
        ));
    }
}
