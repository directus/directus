<?php


use Phinx\Migration\AbstractMigration;

class AddUserLastPasswordUpdate extends AbstractMigration
{
    public function change()
    {
        $usersTable = $this->table('directus_users');
        $fieldsTable = $this->table('directus_fields');

        // -------------------------------------------------------------------------
        // Add password_reset_token column to directus_users
        // -------------------------------------------------------------------------
        if ($usersTable->hasColumn('password_reset_token') == false) {
            $usersTable->addColumn('password_reset_token', 'string', [
                'limit' => 520,
                'encoding' => 'utf8',
                'null' => true,
                'default' => null
            ]);
            $usersTable->save();
        }

        if (!$this->checkFieldExist('directus_users', 'password_reset_token')) {
            $fieldsTable->insert([
                'collection' => 'directus_users',
                'field' => 'password_reset_token',
                'type' =>  \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
                'readonly' => 1,
                'hidden_detail' => 1
            ])->save();
        }
    }

    public function checkFieldExist($collection, $field)
    {
        $checkSql = sprintf('SELECT 1 FROM `directus_fields` WHERE `collection` = "%s" AND `field` = "%s";', $collection, $field);
        return $this->query($checkSql)->fetch();
    }
}
