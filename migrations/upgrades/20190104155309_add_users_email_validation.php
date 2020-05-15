<?php

use Phinx\Migration\AbstractMigration;

class AddUsersEmailValidation extends AbstractMigration
{
    public function up()
    {
        $this->execute('UPDATE `directus_fields` SET `validation` = "$email" WHERE `collection` = "directus_users" AND `field` = "email";');
    }
}
