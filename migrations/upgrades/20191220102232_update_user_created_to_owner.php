<?php


use Phinx\Migration\AbstractMigration;

class UpdateUserCreatedToOwner extends AbstractMigration
{
    public function change()
    {
        // To change the type of all the field of user generated collection to owner
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            ['type' => \Directus\Database\Schema\DataTypes::TYPE_OWNER],
            ['type' =>  'user_created']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            ['interface' => 'owner'],
            ['interface' => 'user_created']
        ));
    }
}
