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

class DB {

  var $db_user;
  var $db_password;
  var $db_name;
  var $db_host;
  var $dbh;
  var $user_token = 'lcjREKokJYNLkIjY7LUqnCs0wnWSvStvb2PTgw4HWu0=';

  /**
   * Constructus
   *
   * @param $db_user
   * @param $db_password
   * @param $db_name
   * @param $db_host
   */
  function __construct($db_user, $db_password, $db_name, $db_host) {

    $this->db_user = $db_user;
    $this->db_password = $db_password;
    $this->db_name = $db_name;
    $this->db_host = $db_host;

    try {
      $this->dbh = new PDO("mysql:host=$db_host;dbname=$db_name;charset=UTF8", $db_user, $db_password);
      $this->dbh->exec("SET CHARACTER SET utf8");
      $this->dbh->query("SET NAMES utf8");
      $this->dbh->setAttribute( PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION );
      //$this->dbh->setAttribute( PDO::ATTR_ERRMODE, PDO::ERRMODE_SILENT );
    } catch(PDOException $e) {
      print_r($e);
      echo "Error";
    }
  }

  /**
   * Get info about all tables
   *
   * @param $params
   */
  function get_tables($params=null) {
    $return = array();
    $name = $this->db_name;

    $sql = 'SELECT
          S.TABLE_NAME as id,
          CASE DU.group
            WHEN -1 THEN "ADMIN"
            ELSE GROUP_CONCAT(DISTINCT DP.type)
          END AS permissions
        FROM
          INFORMATION_SCHEMA.TABLES S
        LEFT JOIN
          directus_users DU ON (DU.token = :user)
        LEFT JOIN
          directus_privileges DP ON (DP.group_id = DU.group) AND (DP.table_name = S.TABLE_NAME OR DP.table_name = "*")
        WHERE
          S.TABLE_SCHEMA = :schema AND
          (S.TABLE_NAME NOT LIKE "directus\_%" OR
          S.TABLE_NAME = "directus_activity" OR
          S.TABLE_NAME = "directus_media" OR
          S.TABLE_NAME = "directus_messages" OR
          S.TABLE_NAME = "directus_users") AND
          (DP.id IS NOT NULL OR DU.group = -1)
        GROUP BY
          S.TABLE_NAME
        ORDER BY
          S.TABLE_NAME, DP.type';

    $sth = $this->dbh->prepare($sql);
    $sth->bindValue(':user', $this->user_token, PDO::PARAM_STR);
    $sth->bindValue(':schema', $this->db_name, PDO::PARAM_STR);
    $sth->execute();

    while($row = $sth->fetch(PDO::FETCH_ASSOC)) {
      $tbl["schema"] = $this->get_table_info($row['id']);
      $tbl["columns"] = $this->get_table($row['id']);
      $tbl["preferences"] = $this->get_table_preferences($row['id']);
      array_push($return, $tbl);
    };

    return $return;
  }

  /**
   *  Get info about one table
   *
   *  @param $tbl_name
   */
  function get_table_info($tbl_name) {

    $sql =  "SELECT
          T.TABLE_NAME AS id,
          T.TABLE_NAME AS table_name,
          CREATE_TIME AS date_created,
          TABLE_COMMENT AS comment,
          ifnull(hidden,0) as hidden,
          ifnull(single,0) as single,
          inactive_by_default,
          is_junction_table,
          UNIX_TIMESTAMP(UPDATE_TIME) as timestamp,
          TABLE_ROWS AS count,
          UPDATE_TIME AS date_modified
        FROM
          INFORMATION_SCHEMA.TABLES T
        LEFT JOIN
          directus_tables DT ON (DT.table_name = T.TABLE_NAME)
        WHERE
          T.TABLE_SCHEMA = :schema AND T.TABLE_NAME = :table_name";


    $sth = $this->dbh->prepare($sql);

    $sth->bindValue(':table_name', $tbl_name, PDO::PARAM_STR);
    //$sth->bindValue(':user', $this->user_token, PDO::PARAM_STR);
    $sth->bindValue(':schema', $this->db_name, PDO::PARAM_STR);
    $sth->execute();

    $info = $sth->fetch(PDO::FETCH_ASSOC);

    if ($info) {
      $info['hidden'] = (boolean)$info['hidden'];
      $info['single'] = (boolean)$info['single'];
      $info['is_junction_table'] = (boolean)$info['is_junction_table'];
    }

    return $info;
  }

  /**
   *  Get table structure
   *
   *  @param $tbl_name
   *  @param $params
   */
   function get_table($tbl_name, $params = null) {

    $return = array();
    $column_name = isset($params['column_name']) ? $params['column_name'] : -1;
    $hasMaster = false;

    $sql =
    '(SELECT
      DISTINCT C.column_name as id,
      C.column_name AS column_name,
      UCASE(C.data_type) as type,
      CHARACTER_MAXIMUM_LENGTH as char_length,
      IS_NULLABLE as is_nullable,
      COLUMN_DEFAULT as default_value,
      ifnull(comment, COLUMN_COMMENT) as comment,
      ifnull(sort, ORDINAL_POSITION) as sort,
      ui,
      ifnull(system,0) as system,
      ifnull(master,0) as master,
      ifnull(hidden_list,0) as hidden_list,
      ifnull(hidden_input,0) as hidden_input,
      table_related,
      junction_table,
      junction_key_left,
      junction_key_right,
      ifnull(D.required,0) as required
    FROM
      INFORMATION_SCHEMA.COLUMNS C
    LEFT JOIN
      directus_columns AS D ON (C.COLUMN_NAME = D.column_name AND C.TABLE_NAME = D.table_name)
    WHERE
      C.TABLE_SCHEMA = :schema AND C.table_name = :table_name AND (:column_name = -1 OR C.column_name = :column_name))
    UNION (SELECT
      DC.`column_name` AS id,
      DC.column_name AS column_name,
      UCASE(data_type) as type,
      NULL AS char_length,
      "NO" as is_nullable,
      NULL AS default_value,
      comment,
      sort,
      ui,
      system,
      master,
      hidden_list,
      hidden_input,
      table_related,
      junction_table,
      junction_key_left,
      junction_key_right,
      DC.required
    FROM
      `directus_columns` DC
    WHERE
      DC.`table_name` = :table_name AND (data_type="alias" OR data_type="MANYTOMANY" OR data_type = "ONETOMANY")
    AND
      (:column_name = -1 OR DC.column_name = :column_name)
    AND
      data_type IS NOT NULL) ORDER BY sort';


    $sth = $this->dbh->prepare($sql);

    $sth->bindValue(':table_name', $tbl_name, PDO::PARAM_STR);
    $sth->bindValue(':schema', $this->db_name, PDO::PARAM_STR);
    //$sth->bindValue(':user', $this->user_token, PDO::PARAM_STR);
    $sth->bindValue(':column_name', $column_name, PDO::PARAM_INT);
    $sth->execute();


    while ($row = $sth->fetch(PDO::FETCH_ASSOC)) {

      foreach ($row as $key => $value) {
        if (is_null($value)) {
          unset ($row[$key]);
        }
      }

      // Basic type casting. Should eventually be done with the schema
      $row["required"] = (bool) $row['required'];
      $row["system"] = (bool) $row["system"];
      $row["master"] = (bool) $row["master"];
      $row["hidden_list"] = (bool) $row["hidden_list"];
      $row["hidden_input"] = (bool) $row["hidden_input"];

      if (array_key_exists('sort', $row)) {
        $row["sort"] = (int)$row['sort'];
      }


      $hasMaster = $row["master"];

      // Default UI types.
      if (!isset($row["ui"])) {
        if ($row["type"] == "ALIAS") { $row["ui"] = "alias"; }
        if ($row["type"] == "MANYTOMANY" || $row["type"] == "ONETOMANY") { $row["ui"] = "relational"; }
        if ($row["type"] == "TINYINT") { $row["ui"] = "checkbox"; }
        if ($row["type"] == "MEDIUMBLOB" || $row["type"] == "BLOB") { $row["ui"] = "blob"; }
        if ($row["type"] == "TEXT" || $row["type"] == "LONGTEXT") { $row["ui"] = "textarea"; }
        if ($row["type"] == "VARCHAR") { $row["ui"] = "textinput"; }
        if ($row["type"] == "DATE" || $row["type"] == "DATETIME" || $row["type"] == "TIME")  { $row["ui"] = "datetime"; }
        if ($row["type"] == "YEAR" || $row["type"] == "INT" || $row["type"] == "SMALLINT" || $row["type"] == "mediumint" || $row["type"] == "float" || $row["type"] == "double" || $row["type"] == "decimal") { $row["ui"] = "numeric"; }
      }

      // Defualts as system columns
      if ($row["id"] == 'id' || $row["id"] == 'active' || $row["id"] == 'sort') {
        $row["system"] = true;
        $row["hidden"] = true;
      }

      if (array_key_exists('ui', $row)) {
        $options = $this->get_ui_options( $tbl_name, $row['id'], $row['ui'] );
      }

      if (isset($options)) {
        $row["options"] = $options;
      }

      array_push($return, array_change_key_case($row,CASE_LOWER));

    }

    // Default column 3 as master. Should be refined!
    //if (!$hasMaster) {
    //  $return[3]['master'] = true;
    //}
    if ($column_name != -1) {
      return $return[0];
    }

    return $return;
   }


  /**
   *  Get table preferences
   *
   *  @param $tbl_name
   */
  function get_table_preferences($tbl_name) {
    $return = array();
    $sql = 'SELECT
          PREFERENCES.*
        FROM
          directus_preferences PREFERENCES
        WHERE PREFERENCES.table_name = :table_name';

    $sth = $this->dbh->prepare($sql);
    $sth->bindValue(':table_name', $tbl_name, PDO::PARAM_STR);
    $sth->execute();

    // A preference exists, return it.
    if ($sth->rowCount()) {
      return $sth->fetch(PDO::FETCH_ASSOC);

    // User doesn't have any preferences for this table yet. Please create!
    } else {

      $sql = 'SELECT
        S.column_name,
        D.system,
        D.master
      FROM
        INFORMATION_SCHEMA.COLUMNS S
      LEFT JOIN
        directus_columns D
      ON
        (D.column_name = S.column_name AND D.table_name = S.table_name)
      WHERE
        S.table_name = :table_name';

      $sth = $this->dbh->prepare($sql);
      $sth->bindValue(':table_name', $tbl_name, PDO::PARAM_STR);
      $sth->execute();

      $columns_visible = array();

      while ($row = $sth->fetch(PDO::FETCH_ASSOC)) {
        if ($row['column_name'] != 'id' && $row['column_name'] != 'active' &&  $row['column_name'] != 'sort') {
          array_push($columns_visible, $row['column_name']);
        }
      }

      // Fix the hardcoded user plz.
      // Maybe save this to db?

      $data = array(
        'user' => 1,
        'columns_visible' => implode (',', $columns_visible),
        'table_name' => $tbl_name,
        'sort' => 'id',
        'sort_order' => 'asc',
        'status' => '2,1'
      );

      // Insert to DB
      $id = $this->insert_entry('directus_preferences', $data);

      return $data;

    }
  }

  /**
   * Get related rows
   * This is used for fetching the related id's in one-many relationships and many-many relationships
   *
   * @param $tbl_name
   * @param $column_name
   * @param $column_equals
   * @param $include_columns
   */
  function get_one_many($tbl_name, $column_name, $column_equals) {
    $sth = $this->dbh->prepare("SELECT * FROM $tbl_name WHERE $column_name = $column_equals");
    $sth->execute();


    $data_set = array();

    while($row = $sth->fetch(PDO::FETCH_ASSOC)){
      foreach ($row as &$value) {
        // Simply check wether its a number or not.
        $value = is_numeric($value) ? (float)$value : $value;
      }
      array_push($data_set, $row);
    }

    return array('rows' => $data_set);
  }

   /**
   * Get related rows
   * This is used for fetching the related id's in one-many relationships and many-many relationships
   * This makes _junction_id reserverd
   *
   * @param $tbl_name
   * @param $column_name
   * @param $column_equals
   * @param $include_columns
   */
  function get_many_many($table_name, $foreign_table, $junction_table, $junction_key_left, $junction_key_right, $column_equals) {

    $data_set = array();

    $sth = $this->dbh->prepare("SELECT JT.id, FT.* FROM $junction_table JT LEFT JOIN $foreign_table FT ON (JT.$junction_key_right = FT.id) WHERE JT.$junction_key_left = $column_equals");
    $sth->execute();

    while($row = $sth->fetch(PDO::FETCH_NUM)){
      $junction_id = $row[0];
      $data = array();
      foreach ($row as $i => $value) {
        $columnMeta = $sth->getColumnMeta($i);
        $data[$columnMeta['name']] = is_numeric($value) ? (float)$value : $value;
      }
      array_push($data_set, array('id'=>$junction_id, 'data' => $data));
    }

    return array('rows' => $data_set);

  }

  /**
   * Get table rows
   * Parts of this function has been written in a rush, it needs more work.
   *
   * @param $tbl_name
   * @param $params
   * @param $id
   */
  function get_entries( $tbl_name, $params=null, $id=null ) {

    //$result = $this->get_table_info($tbl_name);
    $result = array();

    $order_column = isset($params['orderBy']) ? $params['orderBy'] : "id";
    $order_direction = isset($params['orderDirection']) ? $params['orderDirection'] : "DESC";
    $fields = (isset($params['fields']) && is_array($params['fields'])) ? "id,".implode(",", $params['fields']) : "*";

    $per_page = isset($params['perPage']) ? (int) $params['perPage'] : 500;
    $skip = (isset($per_page) && isset($params['currentPage'])) ? (int) $params['currentPage'] * $per_page : 0;

    $id = isset($params['id']) ? $params['id'] : -1;

    $search = isset($params['search']) ? $this->dbh->quote('%'.strtolower($params['search']).'%') : null;
    $active = isset($params['active']) ? $params['active'] : null;

    // Get schema
    // Include 'aliases' (fake directus-columns used to hold one-many and many-many relationships)

    $sql = "SELECT
          column_name,
          data_type,
          NULL as table_related,
          NULL as junction_table,
          NULL as junction_key_left,
          NULL as junction_key_right
        FROM
          information_schema.columns
        WHERE
          `table_name` = :table_name AND `table_schema` = :schema

        UNION SELECT
          column_name,
          data_type,
          table_related,
          junction_table,
          junction_key_left,
          junction_key_right
        FROM
          `directus_columns`
        WHERE
          `data_type` IS NOT NULL AND `table_name` = :table_name AND (`data_type` = 'MANYTOMANY' OR `data_type` = 'ONETOMANY')
        GROUP BY
          `column_name`";

    $sth = $this->dbh->prepare($sql);
    $sth->bindValue(':table_name', $tbl_name, PDO::PARAM_STR);
    $sth->bindValue(':schema', $this->db_name, PDO::PARAM_STR);
    $sth->execute();

    $schema = $sth->fetchAll(PDO::FETCH_ASSOC);

    // This holds a search filter
    $search_sql = "";

    if (isset($search)) {
      $search_sql = "(";
      foreach ($schema as $col) {
        if ($col['data_type'] == 'varchar' || $col['data_type'] == 'int') {
          $search_sql .= "LOWER(" . $col['column_name'] . ") LIKE $search OR ";
        }
      }
      $search_sql = 'AND ' . rtrim($search_sql, 'OR ') . ")";
    }

    // This holds a "active" filter
    $active_sql = "";

    if (isset($active)) {
      // Check if table has an active column
      $has_active = false;
      foreach ($schema as $col) {
        if ($col['column_name'] == 'active') {
          $has_active = true;
          break;
        }
      }

      if ($has_active) {
        $active_sql = "AND active IN ($active)";
      }
    }

    // Get main data

    $sql = "SELECT
          SQL_CALC_FOUND_ROWS T.*
        FROM
          $tbl_name T
        JOIN
           INFORMATION_SCHEMA.TABLES S
        WHERE
          S.TABLE_SCHEMA = :schema AND S.`TABLE_NAME` = :table_name AND (:id = -1 OR T.id = :id) $search_sql $active_sql
        GROUP BY
          T.id
        ORDER BY
          $order_column $order_direction
        LIMIT :skip, :per_page";

    $sth = $this->dbh->prepare($sql);
    $sth->bindValue(':user', $this->user_token, PDO::PARAM_STR);
    $sth->bindValue(':table_name', $tbl_name, PDO::PARAM_STR);
    $sth->bindValue(':skip', $skip, PDO::PARAM_INT);
    $sth->bindValue(':per_page', $per_page, PDO::PARAM_INT);
    $sth->bindValue(':id', $id, PDO::PARAM_INT);
    $sth->bindValue(':schema', $this->db_name, PDO::PARAM_STR);
    $sth->execute();

    // Cast the data
    while($row = $sth->fetch(PDO::FETCH_NUM)){
      $item = array();
      foreach ($row as $i => $value) {
        $item[$schema[$i]['column_name']] = parse_mysql_type($value, $schema[$i]['data_type']);
      }
      array_push($result, $item);
    }

    // This is a set of data. Count visible and total and we are done!
    if ($id == -1) {
      $count_result = $this->dbh->query("SELECT FOUND_ROWS()");
      $row = $count_result->fetchAll();
      $set = array(
        'total'=> (int)$row[0][0],
        'rows'=> $result
        );
      return $set;
    }

    if (sizeof($result) == 0) {
      return array();
    }

    // This is a singular item, include the relationships...
    $result = $result[0];
    $result_size = sizeof($result);
    $schema_size = sizeof($schema);
    $relational_start_index = $schema_size + ($result_size - $schema_size);

    for ($i = $relational_start_index; $i < $schema_size; $i++) {
      if ($schema[$i]['data_type'] == 'MANYTOMANY') {
        $result[$schema[$i]['column_name']] = $this->get_many_many($tbl_name, $schema[$i]['table_related'], $schema[$i]['junction_table'], $schema[$i]['junction_key_left'], $schema[$i]['junction_key_right'], (int)$id);
      }
      if ($schema[$i]['data_type'] == 'ONETOMANY') {
        $result[$schema[$i]['column_name']] = $this->get_one_many($schema[$i]['table_related'], $schema[$i]['junction_key_right'], (int)$id);
      }
    }

    return $result;
  }

  /**
   *  Insersts or updates an entry depending if an id is specified or not.
   *  This one should be updated to support batch updates/inserts
   *
   *  @param  $tbl_name
   *  @param  $id
   *  @param  $data
   */
   function insert_entry($tbl_name, $data, $id = null) {

    // Get Schema
    $sql = "SELECT COLUMN_NAME as name, DATA_TYPE as type FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '$tbl_name'";
    $sth = $this->dbh->query($sql);
    $types = array();

    // Map types to PDO types
    // There is a bug with 'text'
    while($row = $sth->fetch(PDO::FETCH_ASSOC)){
      if ($row['type'] == "int" || $row['type'] == "tinyint" || $row['type'] == "year") {
        $types[$row['name']] = PDO::PARAM_INT;
      } else if ($row['type'] == "text") {
        $types[$row['name']] = PDO::PARAM_LOB;
      } else {
        $types[$row['name']] = PDO::PARAM_STR;
      }
    }

    //Don't bind id, if both data id and querystring id is provided, use data id!
    if (array_key_exists('id', $data)) {
      $id = $data['id'];
      unset($types['id']);
    }

    // Build query and prep...
    // If id is present, make an update, else insert...

    if (isset($id) && !empty($id)) {
      $pairs = '';

      foreach ($types as $key => $value) {

        // Escape column names (should be done more fancy)...
        $col = str_replace("`", "``", $key);
        $pairs .= "`$col`=:$key,";
      }

      $pairs = rtrim($pairs, ',');

      // Id needs to be a number (NO SQL INJECTIONS PLZZZ)
      $id = intval($id);
      $sql = "UPDATE $tbl_name SET $pairs WHERE id = $id";

    } else {
      $cols = '';
      $vals = '';
      foreach ($types as $key => $value) {
        $col = str_replace("`", "``", $key);
        $cols .= "`$col`,";
        $vals .= ":$key,";
      }
      $cols = rtrim($cols, ',');
      $vals = rtrim($vals, ',');
      $sql = "INSERT INTO $tbl_name ($cols) VALUES ($vals)";
    }

    $sth = $this->dbh->prepare($sql);

    // Bind parameters
    foreach ($types as $key => $value) {

      $param = ":".$key;

      $row_value = isset($data[$key]) ? $data[$key] : null;
      // Validation can be done here...
      // For example typechecking

      //mail('olov@rngr.org','subj',$param.'/'.$row_value.'/'.$value);

      $sth->bindValue($param, $row_value, $value);
      //$sth->bindValue($param, $row_value, PDO::PARAM_STR);
    }

    // Go to town
    $sth->execute();

    // Is this really that good?
    if (!isset($id)) { $id = $this->dbh->lastInsertId(); }

    // Relations time!
    $sql = "SELECT column_name, data_type, table_related, junction_table, junction_column FROM directus_columns WHERE table_name = '$tbl_name' AND (data_type = 'ONETOMANY' OR data_type = 'MANYTOMANY')";
    $sth = $this->dbh->query($sql);
    $relations = $sth->fetchAll(PDO::FETCH_ASSOC);

    //print_r($data);

    foreach ($relations as $row) {
      $foreign_data = $data[$row['column_name']];

      if ($row['data_type'] == 'MANYTOMANY') {
        foreach ($foreign_data as $junction_table_row) {
          $junction_id = isset($junction_table_row['id']) ? $junction_table_row['id'] : null;
          $foreign_data = $junction_table_row['data'];

          //Insert/Update in foreign table
          $foreign_id = $this->insert_entry($row['table_related'], $foreign_data);

          //Insert/Update junction table
          $ipa = $this->insert_entry($row['junction_table'], array(
            'id' => $junction_id,
            $tbl_name => $id,
            $row['table_related'] => $foreign_id
          ));
        }
      }

      if ($row['data_type'] == 'ONETOMANY') {
        foreach ($foreign_data as $foreign_table_row) {
          //Make sure that the junction-column always contains this id.
          $foreign_table_row[$row['junction_column']] = $id;
          //Insert/Update data
          $this->insert_entry($row['table_related'], $foreign_table_row);
        }
      }
    }
    return $id;
  }


  /**
   * Wrap entrys in array and calls set_entries
   * This could potentially merge with 'set_settings', 'set_ui_options' and 'insert_entry'
   */
  function set_entry($tbl_name, $data) {
    $this->set_entries($tbl_name, array($data));
    return $this->dbh->lastInsertId();
  }

  /**
   * Set entries
   * This could potentially merge with 'set_settings', 'set_ui_options' and 'insert_entry'
   */
  function set_entries($tbl_name, $data) {

    $cols = array_keys(reset($data));

    $col_str = implode(",",$cols);

    // Build values string.
    $values = "";
    foreach ($data as $i => $row) {
      $values .= "(";
      foreach ($row as $key => $field) $values .= ":$key$i,";
      $values = rtrim($values, ",");
      $values .= "),";
    }
    $values = rtrim($values, ",");

    // Build UPDATE string.
    $update_str = "";
    foreach ($cols as $col) {
      $update_str .= "`$col` = VALUES(`$col`),";
    }
    $update_str = rtrim($update_str, ",");

    // Prepare SQL
    $sql = "INSERT INTO $tbl_name ($col_str) VALUES $values ON DUPLICATE KEY UPDATE $update_str";

    $sth = $this->dbh->prepare($sql);

    // Bind parameters
    $cp = "";
    foreach ($data as $i => $row) {
      foreach ($row as $key => $value) {
        $param = ":$key$i";
        $sth->bindValue($param, $value);
        $cp .= "bindValue($param, $value)";
      }
    }

    // Go to town
    $sth->execute();

  }

  /**
   *  Get settings
   */
  function get_settings() {
    $sth = $this->dbh->query("SELECT `collection`,`name`,`value` FROM directus_settings ORDER BY `collection");
    $result = array();
    while($row = $sth->fetch(PDO::FETCH_ASSOC)) {
      $result[$row['collection']][$row['name']] = $row['value'];
    }
    return $result;
  }

   /**
   *  Set settings
   */
  function set_settings($data) {
    $collection = $data['id'];
    $values = "";

    unset($data['id']);

    //Build string
    foreach ($data as $key => $value) {
      $values .= "('$collection','$key','$value'),";
    }

    $values = rtrim($values, ",");

    $sql = "INSERT INTO directus_settings (collection, `name`, `value`) VALUES $values ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)";
    $sth = $this->dbh->query($sql);
  }

  /**
   *  Get timestamp
   *
   *  @param  $tbl_name
   */
  function get_timestamp($tbl_name) {
    $sth = $this->dbh->query("SELECT UNIX_TIMESTAMP(UPDATE_TIME) as time FROM information_schema.tables WHERE TABLE_NAME = '$tbl_name'");
    $result = $sth->fetch(PDO::FETCH_ASSOC);
    return $result['time'];
  }


  function add_column($tbl_name, $data) {
    $directus_types = array('MANYTOMANY', 'ONETOMANY', 'ALIAS');
    $alias_columns = array('table_name', 'column_name', 'data_type', 'table_related', 'junction_table', 'junction_column', 'sort', 'ui', 'comment');
    $column_name = $data['column_name'];
    $data_type = $data['data_type'];
    $comment = $data['comment'];

    if (in_array($data_type, $directus_types)) {

      //This is a 'virtual column'. Write to directus schema instead of MYSQL
      $data['table_name'] = $tbl_name;
      $data['sort'] = 9999;
      $data['ui'] = ($data_type == 'ALIAS') ? 'ALIAS' : 'RELATIONAL';
      $data = array_intersect_key($data, array_flip($alias_columns));

      //Wrap data in an array so the multi collection can be used.
      $this->set_entries('directus_columns', array($data));

    } else {
      if (array_key_exists('char_length', $data)) {
        $data_type = $data_type.'('.$data['char_length'].')';
      }

      $sql = "ALTER TABLE $tbl_name ADD COLUMN $column_name $data_type COMMENT '$comment'";
      $sth = $this->dbh->prepare($sql);
      $sth->execute();
    }

    return $column_name;
  }

  /**
   *  Set ui options
   *  Almost identical to set_settings. Could the two be combined?
   *
   *  @param  $tbl_name
   *  @param  $col_name
   *  @param  $datatype_name
   */
  function set_ui_options($data, $tbl_name, $column_name, $ui_name) {
    $values = "";

    unset($data['id']);

    //Build string
    foreach ($data as $key => $value) {
      $values .= "('$tbl_name','$column_name','$ui_name','$key','$value'),";
    }

    $values = rtrim($values, ",");

    $sql = "INSERT INTO directus_ui (`table_name`, `column_name`, `ui_name`, `name`, `value`) VALUES $values ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)";
    $sth = $this->dbh->query($sql);
  }

  /**
   *  Get ui options
   *
   *  @param  $tbl_name
   *  @param  $col_name
   *  @param  $datatype_name
   */
   function get_ui_options( $tbl_name, $col_name, $datatype_name ) {

    $sth = $this->dbh->query("SELECT ui_name as id, name, value FROM directus_ui WHERE column_name='$col_name' AND table_name='$tbl_name' AND ui_name='$datatype_name' ORDER BY ui_name");

    $ui; $result = array(); $item = array();

    while($row = $sth->fetch(PDO::FETCH_ASSOC)) {
      //first case
      if (!isset($ui)) { $item['id'] = $ui = $row['id']; }

      //new ui = new item
      if ($ui != $row['id']) {
        array_push($result, $item);
        $item = array();
        $item['id'] = $ui = $row['id'];
      }

      $item[$row['name']] = $row['value'];
    };
    if (count($item) > 0) {
      array_push($result, $item);
    }
    if (sizeof($result)) {
      return $result[0];
    }
   }
};