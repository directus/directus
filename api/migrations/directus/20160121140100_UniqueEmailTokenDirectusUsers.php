<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class UniqueEmailTokenDirectusUsers extends Ruckusing_Migration_Base
{
    public function up()
    {
        $this->add_index("directus_users", "email", array(
          "unique"=>true,
          "name"=>"directus_users_email_unique"
          )
        );

        $this->add_index("directus_users", "token", array(
          "unique"=>true,
          "name"=>"directus_users_token_unique"
          )
        );
    }//up()

    public function down()
    {
        $this->remove_index("directus_users", "email", array(
          "unique"=>true,
          "name"=>"directus_users_email_unique"
          )
        );

        $this->remove_index("directus_users", "token", array(
          "unique"=>true,
          "name"=>"directus_users_token_unique"
          )
        );
    }//down()
}
