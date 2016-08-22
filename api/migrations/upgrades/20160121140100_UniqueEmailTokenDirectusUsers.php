<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class UniqueEmailTokenDirectusUsers extends Ruckusing_Migration_Base
{
    public function up()
    {
        if (!$this->has_index('directus_users', 'email', 'directus_users_email_unique')) {
            $this->add_index('directus_users', 'email', [
                'unique' => true,
                'name' => 'directus_users_email_unique'
            ]);
        }

        if (!$this->has_index('directus_users', 'token', 'directus_users_token_unique')) {
            $this->add_index('directus_users', 'token', [
                'unique' => true,
                'name' => 'directus_users_token_unique'
            ]);
        }
    }//up()

    public function down()
    {
        if ($this->has_index('directus_users', 'email', 'directus_users_email_unique')) {
            $this->remove_index('directus_users', 'email', [
                'unique' => true,
                'name' => 'directus_users_email_unique'
            ]);
        }

        if ($this->has_index('directus_users', 'token', 'directus_users_token_unique')) {
            $this->remove_index('directus_users', 'token', [
                'unique' => true,
                'name' => 'directus_users_token_unique'
            ]);
        }
    }//down()
}
