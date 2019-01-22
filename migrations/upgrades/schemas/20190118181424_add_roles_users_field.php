<?php

use Phinx\Migration\AbstractMigration;

class AddRolesUsersField extends AbstractMigration
{
    public function up()
    {
        $result = $this->query('SELECT 1 FROM `directus_fields` WHERE `collection` = "directus_roles" AND `field` = "users";')->fetch();

        if (!$result) {
            $this->execute('INSERT INTO `directus_fields` (`collection`, `field`, `type`, `interface`) VALUES ("directus_roles", "users", "o2m", "many-to-many");');
        }
    }
}
