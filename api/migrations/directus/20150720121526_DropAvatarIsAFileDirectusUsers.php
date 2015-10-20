<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class DropAvatarIsAFileDirectusUsers extends Ruckusing_Migration_Base
{
    public function up()
    {
        $this->remove_column('directus_users', 'avatar_is_file');
    }//up()

    public function down()
    {
        $this->add_column('avatar_is_file', 'tinyinteger', array(
          'limit' => 1,
          'default' => 0
        )
      );
    }//down()
}
