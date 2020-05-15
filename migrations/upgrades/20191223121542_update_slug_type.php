<?php


use Phinx\Migration\AbstractMigration;

class UpdateSlugType extends AbstractMigration
{
    public function change()
    {
        // Replace tupe of slug from string to slug
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'type' => \Directus\Database\Schema\DataTypes::TYPE_SLUG,
            ],
            ['interface' =>  'slug']
        ));
    }
}
