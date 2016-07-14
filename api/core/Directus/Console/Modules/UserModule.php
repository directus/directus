<?php
/**
 * This file is part of Directus.
 *
 * Directus is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Directus is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Directus.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

/**
 * CLI Install Module.
 *
 * This module provides the commands to manage Directus users.
 *
 * @category   Interfaces
 * @package    Directus/Console/Modules
 * @author     Fabio 'MrWHO' Torchetti <mrwho@wedjaa.net>
 * @copyright  2016 Wedjaa Inc
 * @license    https://www.gnu.org/licenses/gpl-3.0.en.html  GPLv3 License
 *
 */

namespace Directus\Console\Modules;

use Directus\Bootstrap;
use Directus\Console\Exception\UnsupportedCommandException;
use Directus\Console\Exception\WrongArgumentsException;
use Directus\Util\StringUtils;
use Zend\Db\TableGateway\TableGateway;

class UserModule implements ModuleInterface
{

  private $__module_name = 'user';
  private $commands_help;
  private $help;

  public function __construct()
  {

    $this->help  = array (
      'password' => ''
        .PHP_EOL."\t\t-e ".__t('User e-mail address.')
        .PHP_EOL."\t\t-p ".__t('New password for the user.')
        .PHP_EOL."\t\t-d ".__t('Directus path. Default: ' . BASE_PATH)
    );

    $this->commands_help  = array (
     'password' => __t('Change user password: ').PHP_EOL.PHP_EOL."\t\t"
        .$this->__module_name.':password -e user_email -p new_password -d directus_path'.PHP_EOL
   );

  }

  public function get_module_name() {
    return $this->__module_name;
  }

  public function get_info() {
    return $this->__module_name.__t(': commands to manage Directus users');
  }

  public function get_commands() {
    return $this->commands_help;
  }

  public function get_command_help($command) {
    if (!array_key_exists($command, $this->help)) {
      throw new UnsupportedCommandException( $this->__module_name.':'. $command . __t(' command does not exists!'));
    }
    return $this->help[$command];
  }

  public function run_command($command, $args, $extra) {
    $cmd_name = 'cmd_'.$command;
    if (!method_exists($this, $cmd_name)) {
      throw new UnsupportedCommandException( $this->__module_name.':'. $command . __t(' command does not exists!'));
    }
    $this->$cmd_name($args, $extra);
  }

  public function cmd_help($args, $extra) {
    if (count($extra)==0) {
      throw new WrongArgumentsException( $this->__module_name.':help '.  __t('missing command to show help for!'));
    }
    echo PHP_EOL.__t('Directus Command ').$this->__module_name.':'.$extra[0].__t(' help').PHP_EOL.PHP_EOL;
    echo "\t".$this->commands_help[$extra[0]].PHP_EOL;
    echo "\t".__t('Options: ').PHP_EOL.$this->get_command_help($extra[0]);
    echo PHP_EOL.PHP_EOL;
  }

  public function cmd_password($args, $extra) {

      $directus_path = BASE_PATH;

      $data = [];

      foreach($args as $key => $value) {
          switch($key) {
              case 'e':
                  $data['user_email'] = $value;
                  break;
              case 'p':
                  $data['user_password'] = $value;
                  break;
              case 'd':
                  $directus_path = $value;
                  break;
          }
      }

      if (!isset($data['user_email'])) {
        throw new WrongArgumentsException( $this->__module_name.':password '.  __t('missing user e-mail to change password for!'));
      }

      if (!isset($data['user_password'])) {
        throw new WrongArgumentsException( $this->__module_name.':password '.  __t('missing new password for user!'));
      }

      $salt = StringUtils::random();
      $hash = sha1($salt.$data['user_password']);

      require_once $directus_path.'/api/config.php';

      $db = Bootstrap::get('ZendDb');
      $tableGateway = new TableGateway('directus_users', $db);

      $update = array(
          'password' => $hash,
          'salt' => $salt
      );

      $tableGateway->update($update, array('email' => $data['user_email']));
    }

}
