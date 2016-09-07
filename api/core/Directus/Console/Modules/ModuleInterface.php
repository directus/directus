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
 * CLI Modules interface.
 *
 * This is the interface used by the CLI Modules. Basic functionality of
 * a module is to: provide a description of the module, list available commands,
 * provide help on a command and execute a command with specific arguments.
 *
 * @category   Interfaces
 * @package    Directus/Console/Modules
 * @author     Fabio 'MrWHO' Torchetti <mrwho@wedjaa.net>
 * @copyright  2016 Wedjaa Inc
 * @license    https://www.gnu.org/licenses/gpl-3.0.en.html  GPLv3 License
 *
 */

namespace Directus\Console\Modules;

interface ModuleInterface
{

    /**
     *  Get the name of the module.
     *   *
     * @return string The name this module should be known for.
     *
     */
    public function getModuleName();

    /**
     *  Get information about a CLI module.
     *
     *  Provides information about a module fit to create a brief description of
     *  the module to be presented to the user.
     *
     * @return string A brief description of the module.
     *
     */
    public function getInfo();

    /**
     *  Returns a list of commands provided by the module.
     *
     *  Returns a list of commands provided by the module and a brief usage and
     *  description of the command arguments.  Commands are returned as an
     *  associative array that has the command as the key and a descriptive text
     *  as the value.
     *
     *  <code>
     *  $commands = array(
     *    'config' => 'Configure Directus.',
     *    'database' => 'Populate the DB with the schema.',
     *    'install' => 'Install the initial configuration.'
     *  );
     *  </code>
     *
     * @return array[string]string A brief description of the module commands.
     *
     */
    public function getCommands();

    /**
     *  Returns help for a command provided by this module.
     *
     *  Provides help text for a specific command implemented by this module.
     *
     * @param string $command The command to get help for.
     *
     * @return string A brief description of the module command.
     *
     * @throws UnsupportedCommand Thrown when a module does not support a command.
     */
    public function getCommandHelp($command);

    /**
     *  Executed a command provided by this module
     *
     *  Executes a command provided by this module with the arguments passed to the
     *  function.
     *
     *  Arguments are passed already parsed to the command in an associative array
     *  where the key is the name of the argument:
     *
     *  <code>
     *  $args = array(
     *    'db_name' => 'directus',
     *    'db_user' => 'directus_user'
     *  );
     *  </code>
     *
     *  Extra - unamed - arguments are passed in a simple array of strings.
     *
     * @param string $command The command to execute.
     * @param array [string]string $args The arguments for the command.
     * @param array [string] $extra Un-named arguments passed to the command.
     *
     * @return void This function does not return a value.
     *
     * @throws UnsupportedCommand if the module does not support a command.
     * @throws WrongArguments if the arguments passed to the command are not
     *          sufficient or correct to execute the command.
     * @throws CommandFailed if the module failed to execute a command.
     */
    public function runCommand($command, $args, $extra);
}
