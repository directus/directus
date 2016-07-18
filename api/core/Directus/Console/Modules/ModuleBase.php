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
 * CLI Base Module.
 *
 * This module provides the base implementation of the Module Interface.
 *
 * @category   Interfaces
 * @package    Directus/Console/Modules
 * @author     Fabio 'MrWHO' Torchetti <mrwho@wedjaa.net>
 * @copyright  2016 Wedjaa Inc
 * @license    https://www.gnu.org/licenses/gpl-3.0.en.html  GPLv3 License
 *
 */

namespace Directus\Console\Modules;

use Directus\Console\Exception\UnsupportedCommandException;

class ModuleBase implements ModuleInterface
{

    public function getModuleName()
    {
        return $this->__module_name;
    }

    public function getInfo()
    {
        return $this->__module_name.': '.__t($this->__module_description);
    }

    public function getCommands()
    {
        return $this->commands_help;
    }

    public function getCommandHelp($command)
    {
        if (!array_key_exists($command, $this->help)) {
            throw new UnsupportedCommandException($this->__module_name.':'. $command . __t(' command does not exists!'));
        }
        return $this->help[$command];
    }

    public function runCommand($command, $args, $extra)
    {
        $cmd_name = 'cmd'.ucwords($command);
        if (!method_exists($this, $cmd_name)) {
            throw new UnsupportedCommandException($this->__module_name.':'. $command . __t(' command does not exists!'));
        }
        $this->$cmd_name($args, $extra);
    }
}
