<?php

use Phinx\Migration\AbstractMigration;

class ConvertUserRoles extends AbstractMigration
{
  public function change() {
    $usersTable = $this->table('directus_users');

    // -------------------------------------------------------------------------
    // Add role column to directus_users
    // -------------------------------------------------------------------------
    if ($usersTable->hasColumn('role') == false) {
        $usersTable->addColumn('role', 'integer', [
            'null' => true,
            'default' => null
        ]);
        $usersTable->save();
    }

    // -------------------------------------------------------------------------
    // Add users' roles to directus_roles
    // It does this by retrieving the role ID from directus_user_roles and adding
    // that role to the role column in directus_users
    // -------------------------------------------------------------------------
    if ($this->hasTable('directus_user_roles')) {
        $stmt = $this->query("SELECT * FROM `directus_user_roles`");
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)){
            $this->execute('UPDATE `directus_users` SET `role` = '.$row['role'].' where id = '.$row['user'].';');
        }
    }

    // -------------------------------------------------------------------------
    // Remove directus_user_roles table
    // -------------------------------------------------------------------------
    if ($this->hasTable('directus_user_roles')) {
      $this->table('directus_user_roles')->drop();
    }
  }
}
