<?php

/**
 * Directus - awesome content management framework for everyone
 *
 * @copyright   2012 RANGER
 * @link        http://www.getdirectus.com
 * @license     http://www.getdirectus.com/license
 * @version     6.0.0
 *
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
 * along with Directus. If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * DB
 *
 * This class connects to a MYSQL database and supplies data for the REST api
 * Will eventually be implemented as a singleton.
 *
 * @package Directus
 * @since   6.0.0
 */

require dirname(__FILE__) . '/mysql.php';

class DB extends MySQL {

  var $user_token = 'lcjREKokJYNLkIjY7LUqnCs0wnWSvStvb2PTgw4HWu0=';
  var $user_id = 1;


  function set_entry_relational($tbl_name, $data) {
    // These columns are aliases and doesn't have corresponding
    // columns in the DB, for example 'alias' and 'relational'
    $alias_types = array('ONETOMANY','MANYTOMANY','ALIAS');
    $alias_columns = array();
    $alias_meta = array();
    $alias_data = array();

     // Gram the schema so we can see what's possible
    $schema = $this->get_table($tbl_name);

    // Grab relational columns
    foreach($schema as $column) {
      if (in_array($column['type'], $alias_types)) {
        array_push($alias_columns, $column['column_name']);
        $alias_meta[$column['column_name']] = $column;
      }
    }

    // Seperate relational data
    foreach($data as $column_name => $value) {
      if (in_array($column_name, $alias_columns)) {
        $alias_data[$column_name] = $value;
        unset($data[$column_name]);
      }
    }

    // Update local (non-relational) data
    $id = $this->set_entry($tbl_name, $data);
    $this->log_activity($tbl_name, 'UPDATE', $id, 'TEST');

    // Update the related columns
    foreach($alias_meta as $column_name => $item) {

      if (!isset($alias_data[$column_name])) continue;

      $data = $alias_data[$column_name];
      $table_related = $item['table_related'];
      $junction_key_right = $item['junction_key_right'];

      switch($item['type']) {
        case 'ONETOMANY':
          foreach ($data as $foreign_table_row) {
            $foreign_table_row[$junction_key_right] = $id;
            $this->set_entry_relational($table_related, $foreign_table_row);
          }
          break;

        case 'MANYTOMANY':
          $junction_table = $item['junction_table'];
          $junction_key_left = $item['junction_key_left'];
          foreach($data as $junction_table_row) {

            // Delete?
            if (isset($junction_table_row['active']) && ($junction_table_row['active'] == '0')) {
              $id = intval($junction_table_row['id']);
              $this->dbh->exec("DELETE FROM $junction_table WHERE id=$id");
              continue;
            }

            // Update foreign table
            $foreign_id = $this->set_entry_relational($table_related, $junction_table_row['data']);

            // Update junction table
            $this->set_entry_relational($junction_table, array(
              'id' => $foreign_id,
              $junction_key_left => $id,
              $junction_key_right => $foreign_id
            ));
          }
          break;
      }
    }

    return $id;
  }

  function set_entry($tbl_name, $data) {
    $this->set_entries($tbl_name, array($data));
    return (isset($data['id'])) ? $data['id'] : $this->dbh->lastInsertId();
  }

  function set_settings($data) {
    $keys = array('collection' => $data['id']);
    unset($data['id']);
    $this->set_entries('directus_settings', to_name_value($data, $keys));
  }

  function set_ui_options($data, $tbl_name, $column_name, $ui_name) {
    $id = $data['id'];
    unset($data['id']);
    $keys = array('table_name' => $tbl_name, 'column_name' => $column_name, 'ui_name' => $ui_name);
    $this->set_entries('directus_ui', to_name_value($data, $keys));
    $this->log_activity('directus_ui', 'UPDATE', $id, $tbl_name .','. $column_name . ',' . $ui_name, $data);
  }

  function log_activity($tbl_name, $action, $row_id, $identifier, $data) {
    $this->set_entry('directus_activity', array(
      'identifier' => $identifier,
      'table_name' => $tbl_name,
      'action' => $action,
      'row_id' => $row_id,
      'user' => 0,
      'data' => json_encode($data)
    ));
  }
};