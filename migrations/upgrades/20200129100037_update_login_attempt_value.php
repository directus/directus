<?php

use Phinx\Migration\AbstractMigration;

class UpdateLoginAttemptValue extends AbstractMigration
{
    public function change()
    {
        // -------------------------------------------------------------------------
        // Update Login Attempts Allowed Value
        // -------------------------------------------------------------------------
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_settings',
            ['value' => 25],
            ['key' => 'login_attempts_allowed']
        ));
    }
}
