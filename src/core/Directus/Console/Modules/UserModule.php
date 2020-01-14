<?php

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

    public function __construct($basePath)
    {
        parent::__construct($basePath);

        $this->help = [
            'password' => ''
                . PHP_EOL . "\t\t-e " . 'User e-mail address.'
                . PHP_EOL . "\t\t-p " . 'New password for the user.'
                . PHP_EOL . "\t\t-k " . 'Project Key.'
                . PHP_EOL . "\t\t-d " . 'Directus path. Default: ' . $this->getBasePath()
        ];

        $this->commands_help = [
            'password' => 'Change User Password: ' . PHP_EOL . PHP_EOL . "\t\t"
                . $this->__module_name . ':password -e user_email -p new_password -k project_key -d directus_path' . PHP_EOL
        ];

        $this->__module_name = 'user';
        $this->__module_description = 'commands to manage Directus users';
    }

    public function cmdPassword($args, $extra)
    {
        $directus_path = $this->getBasePath();

        $data = [];

        foreach ($args as $key => $value) {
            switch ($key) {
                case 'e':
                    $data['user_email'] = $value;
                    break;
                case 'p':
                    $data['user_password'] = $value;
                    break;
                case 'k':
                    $data['project_name'] = $value;
                    break;
                case 'd':
                    $directus_path = $value;
                    break;
            }
        }

        if (!isset($data['user_email'])) {
            throw new WrongArgumentsException($this->__module_name . ':password ' . 'missing user e-mail to change password for!');
        }

        if (!isset($data['user_password'])) {
            throw new WrongArgumentsException($this->__module_name . ':password ' . 'missing new password for user!');
        }

        if (!isset($data['project_name'])) {
            throw new WrongArgumentsException($this->__module_name . ':password ' . 'missing project key!');
        }

        $user = new User($directus_path, $data['project_name']);
        try {
            $user->changePassword($data['user_email'], $data['user_password']);
        } catch (PasswordChangeException $ex) {
            throw new CommandFailedException('Error changing user password' . ': ' . $ex->getMessage());
        }
    }
}
