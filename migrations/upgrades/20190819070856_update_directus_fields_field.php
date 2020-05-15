<?php


use Phinx\Migration\AbstractMigration;

class UpdateDirectusFieldsField extends AbstractMigration
{
    public function up()
    {
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'readonly' => 0,
              'note' => 'Duration must be in seconds'
            ],
            ['collection' => 'directus_files', 'field' => 'duration']
        ));
    }
}
