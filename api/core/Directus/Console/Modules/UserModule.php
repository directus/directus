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
 * @category   Classes
 * @package    Directus/Console/Modules
 * @author     Fabio 'MrWHO' Torchetti <mrwho@wedjaa.net>
 * @copyright  2016 Wedjaa Inc
 * @license    https://www.gnu.org/licenses/gpl-3.0.en.html  GPLv3 License
 *
 */

namespace Directus\Console\Modules;

use Directus\Console\Common\Exception\PasswordChangeException;
use Directus\Console\Common\User;
use Directus\Console\Exception\CommandFailedException;
use Directus\Console\Exception\WrongArgumentsException;


class UserModule extends ModuleBase
{

    protected $__module_name = 'user';
    protected $__module_description = 'commands to manage Directus users';
    protected $commands_help;
    protected $help;

    public function __construct()
    {

        $this->help = [
            'password' => ''
                . PHP_EOL . "\t\t-e " . __t('User e-mail address.')
                . PHP_EOL . "\t\t-p " . __t('New password for the user.')
                . PHP_EOL . "\t\t-d " . __t('Directus path. Default: ' . BASE_PATH)
        ];

        $this->commands_help = [
            'password' => __t('Change User Password: ') . PHP_EOL . PHP_EOL . "\t\t"
                . $this->__module_name . ':password -e user_email -p new_password -d directus_path' . PHP_EOL
        ];

        $this->__module_name = 'user';
        $this->__module_description = 'commands to manage Directus users';
    }

    public function cmdPassword($args, $extra)
    {
        $directus_path = BASE_PATH;

        $data = [];

        foreach ($args as $key => $value) {
            switch ($key) {
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
            throw new WrongArgumentsException($this->__module_name . ':password ' . __t('missing user e-mail to change password for!'));
        }

        if (!isset($data['user_password'])) {
            throw new WrongArgumentsException($this->__module_name . ':password ' . __t('missing new password for user!'));
        }

        $user = new User($directus_path);
        try {
            $user->changePassword($data['user_email'], $data['user_password']);
        } catch (PasswordChangeException $ex) {
            throw new CommandFailedException(__t('Error changing user password') . ': ' . $ex->getMessage());
        }

    }
}
