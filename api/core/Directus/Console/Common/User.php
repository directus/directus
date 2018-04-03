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
 * CLI User Handling helper module
 *
 * This module provides the base functions to manage Directus users.
 *
 * @category   Classes
 * @package    Directus/Console/Common
 * @author     Fabio 'MrWHO' Torchetti <mrwho@wedjaa.net>
 * @copyright  2016 Wedjaa Inc
 * @license    https://www.gnu.org/licenses/gpl-3.0.en.html  GPLv3 License
 *
 */

namespace Directus\Console\Common;


use Directus\Authentication\Provider;
use Directus\Bootstrap;
use Directus\Console\Common\Exception\PasswordChangeException;
use Directus\Console\Common\Exception\UserUpdateException;
use Directus\Util\StringUtils;
use Zend\Db\TableGateway\TableGateway;

class User
{

    private $directus_path;
    private $db;
    private $usersTableGateway;

    public function __construct($base_path)
    {

        if ($base_path == null) {
            $base_path = BASE_PATH;
        } else {
            $this->directus_path = $base_path;
        }

        require_once $this->directus_path . '/api/config.php';
        $this->db = Bootstrap::get('ZendDb');

        $this->usersTableGateway = new TableGateway('directus_users', $this->db);
    }

    /**
     *  Change the password of a user given their e-mail address
     *
     *  The function will change the password of a user given their e-mail
     *  address. If there are multiple users with the same e-mail address, and
     *  this should never be the case, all of their passwords would be changed.
     *
     *  The function will generate a new salt for every password change.
     *
     * @param string $email The e-mail of the user whose password is being
     *         changed.
     * @param string $password The new password.
     *
     * @return void
     *
     * @throws PasswordChangeException Thrown when password change has failed.
     *
     */
    public function changePassword($email, $password)
    {
        $auth = Bootstrap::get('auth');
        $salt = StringUtils::randomString();
        $hash = $auth->hashPassword($password, $salt);
        $user = $this->usersTableGateway->select(['email' => $email])->current();

        if (!$user) {
            throw new \InvalidArgumentException(__t('User not found'));
        }

        try {
            $update = [
                'password' => $hash,
                'salt' => $salt,
                'access_token' => sha1($user->id . StringUtils::randomString())
            ];

            $changed = $this->usersTableGateway->update($update, ['email' => $email]);
            if ($changed == 0) {
                throw new PasswordChangeException(__t('Could not change password for ') . $email . ': ' . __t('e-mail not found.'));
            }
        } catch (\PDOException $ex) {
            throw new PasswordChangeException(__t('Failed to change password') . ': ' . str($ex));
        }

    }

    /**
     *  Change the e-mail of a user given their ID.
     *
     *  The function will change the e-mail of a user given their ID. This may have
     *  undesired effects, this function is mainly useful during the setup/install
     *  phase.
     *
     *
     * @param string $id The ID of the user whose e-mail address we want to change.
     * @param string $email The new e-mail address for the use.
     *
     * @return void
     *
     * @throws UserUpdateException Thrown when the e-mail address change fails.
     *
     */
    public function changeEmail($id, $email)
    {

        $update = [
            'email' => $email
        ];

        try {
            $this->usersTableGateway->update($update, ['id' => $id]);
        } catch (\PDOException $ex) {
            throw new PasswordChangeException(__t('Could not change email for ID ') . $id . ': ' . str($ex));
        }
    }

}
