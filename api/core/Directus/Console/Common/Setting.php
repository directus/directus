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
 * CLI Settings Handling helper module
 *
 * This module provides the base functions to manage Directus settings.
 *
 * @category   Classes
 * @package    Directus/Console/Common
 * @author     Fabio 'MrWHO' Torchetti <mrwho@wedjaa.net>
 * @copyright  2016 Wedjaa Inc
 * @license    https://www.gnu.org/licenses/gpl-3.0.en.html  GPLv3 License
 *
 */

namespace Directus\Console\Common;


use Directus\Bootstrap;
use Directus\Console\Common\Exception\SettingUpdateException;
use Zend\Db\TableGateway\TableGateway;

class Setting
{

    private $directus_path;
    private $db;
    private $settingsTableGateway;

    public function __construct($base_path)
    {

        if ($base_path == null) {
            $base_path = BASE_PATH;
        } else {
            $this->directus_path = $base_path;
        }

        require_once $this->directus_path . '/api/config.php';
        $this->db = Bootstrap::get('ZendDb');

        $this->settingsTableGateway = new TableGateway('directus_settings', $this->db);
    }

    /**
     *  Check if base settings have already been defined.
     *
     *  The function return true if base settings have already been defined,
     *  false in any othe case.
     *
     * @return boolean True if settings have already been defined. False in any
     *                  other case.
     *
     */
    public function isConfigured()
    {
        try {
            $rowset = $this->settingsTableGateway->select();
            if ($rowset->count() > 0) {
                return true;
            }
            return false;
        } catch (PDOException $ex) {
            return false;
        }
    }

    /**
     *  Check if a settings has already been defined.
     *
     *  The function return true if the setting has already been defined for a collection,
     *  false in any othe case.
     *
     * @param string $collection The collection to which this setting applies.
     * @param string $setting The name of the setting to check.
     *
     * @return boolean True if setting has been defined for the collection. False in any
     *                  other case.
     *
     */
    public function settingExists($collection, $setting)
    {
        try {
            $rowset = $this->settingsTableGateway->select([
                'collection' => $collection,
                'name' => $setting
            ]);
            if ($rowset->count() > 0) {
                return true;
            }
            return false;
        } catch (PDOException $ex) {
            return false;
        }
    }

    /**
     *  Creates a setting and sets its value for Directus.
     *
     *  The function will create the given setting with the passed value.
     *
     * @param string $collection The collection to which this setting applies.
     * @param string $setting The name of the setting to create.
     * @param string $value The value of the setting.
     *
     * @return void
     *
     * @throws SettingUpdateException Thrown when the creation of the setting fails.
     *
     */
    public function createSetting($collection, $setting, $value)
    {

        $insert = [
            'collection' => $collection,
            'name' => $setting,
            'value' => $value
        ];

        try {
            $this->settingsTableGateway->insert($insert);
        } catch (PDOException $ex) {
            throw new SettingUpdateException(__t('Could not create setting ') . $collection . '.' . $setting . ': ' . __t('PDO Error: ') . string($ex));
        }

    }

    /**
     *  Sets the value of a setting for Directus, creating it if needed.
     *
     *  The function will change the given setting to the passed value if it already
     *  exists and will create it if it doesn't.
     *
     * @param string $collection The collection to which this setting applies.
     * @param string $setting The name of the setting to change.
     * @param string $value The value of the setting.
     *
     * @return void
     *
     * @throws SettingUpdateException Thrown when the changing the setting fails.
     *
     */
    public function setSetting($collection, $setting, $value)
    {

        if (!$this->settingExists($collection, $setting)) {
            return $this->createSetting($collection, $setting, $value);
        }

        $update = [
            'value' => $value
        ];

        try {
            $this->settingsTableGateway->update($update, [
                'collection' => $collection,
                'name' => $setting
            ]);
        } catch (\PDOException $ex) {
            throw new SettingUpdateException(__t('Could not change setting ') . $collection . '.' . $setting . ': ' . __t('PDO Error: ') . string($ex));
        }
    }

}
