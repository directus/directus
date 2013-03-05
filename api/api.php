<?php
require dirname(__FILE__) . '/config.php';
require dirname(__FILE__) . '/core/db.php';
require dirname(__FILE__) . '/core/functions.php';

$db = new DB(DB_USER, DB_PASSWORD, DB_NAME, DB_HOST);

$http_method = $_SERVER['REQUEST_METHOD'];
$collection =  isset($_GET['api_collection']) ? $_GET['api_collection'] : null;
$params = $_GET;
$data = json_decode(file_get_contents('php://input'), true);

/**
 * Request an api-method with parameters, return php data object
 *
 * @param     String  $collection
 * @param     String  $http_method
 * @param     Array $paramscccasdasdas
 * @return    Object
 */

function request ( $collection, $http_method, $params=array(), $data=array(), $file=null ) {

  global $db;

  $id = (array_key_exists('id', $params)) ? $params['id'] : null;
  $tbl_name = (array_key_exists('table_name', $params)) ? $params["table_name"] : null;
  $column_name = (array_key_exists('column_name', $params)) ? $params['column_name'] : null;


  //////////////////////////////////////////////////////////////////////////////
  // TABLES

  if ( $collection == "tables" ) {

    //return 401;

    switch ( $http_method ) {

      case "GET":
        return $db->get_tables($params);

      case "PUT":
        return array();
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  // USERS

  if ( $collection == "users" ) {
    $users = $db->get_users();
    //$users = $db->get_entries("directus_users", $params, $id);

    switch ($http_method) {
      case "PUT":
        $db->set_entry('directus_users', $data);
        break;
      case "PUSH":
        $id = $db->set_entry('directus_users', $data);
        break;
    }

    //This is a collection of users...
    if (isset($users['rows'])) {
      foreach ($users['rows'] as &$user) {
        $user['avatar'] = get_gravatar($user['email'], 28, 'identicon');
      }
      return $users;
    }

    $users['avatar'] = get_gravatar($users['email'], 28);
    return $users;
  }

  //////////////////////////////////////////////////////////////////////////////
  // ACTIVITY

  if ( $collection == "activity" ) {
    return $db->get_activity();
  }

  //////////////////////////////////////////////////////////////////////////////
  // REVISIONS
  if ( $collection == "revisions" ) {
    return $db->get_revisions($params);
  }

  //////////////////////////////////////////////////////////////////////////////
  // GROUPS

  if ( $collection == "groups" ) {

    if (isset($id)) {
      return $db->get_group(1);
    }

    return $db->get_entries("directus_groups");
  }

  //////////////////////////////////////////////////////////////////////////////
  // ENTRIES

  if ( $collection == "entries" ) {

    switch ( $http_method ) {

      case "PUT":
        if (!isset($id)) {
          $db->set_entries($tbl_name, $data);
          break;
        }
        $db->set_entry_relational($tbl_name, $data);
        break;

      case "POST":
        $id = $db->set_entry_relational($tbl_name, $data);
        $params['id'] = $id;
        break;

      case "DELETE":
        echo $db->delete($tbl_name, $id);
        return;
    }

    //Last-Modified: Tue, 15 Nov 1994 12:45:26 GMT
    //$table_info = $db->get_table_info($tbl_name);
    //print_r(strtotime($table_info['date_modified']));
    $result = $db->get_entries($tbl_name, $params, $id);

    // an id is set but there is no result
    //if (isset($id) && !isset($result)) {
    //  http_response_code(404);
    //  exit(0);
    //};

    return $result;
  }

  //////////////////////////////////////////////////////////////////////////////
  // COLUMNS

  if ( $collection == "columns" ) {
    switch ($http_method) {
      case "POST":
        $params['column_name'] = $db->add_column($tbl_name, $data);
        break;
      case "PUT":
        //Add table name to dataset.
        foreach ($data as &$row) $row['table_name'] = $tbl_name;
        $db->set_entries('directus_columns', $data);
        break;
    }
    return $db->get_table($tbl_name, $params);
  }

  //////////////////////////////////////////////////////////////////////////////
  // TABLE

  if ( $collection == "table" ) {
    switch ($http_method) {
      case "PUT":
        $db->set_table_settings($data);
        break;
    }
    return $db->get_table_info($tbl_name, $params);
  }

  //////////////////////////////////////////////////////////////////////////////
  // UI

  if ( $collection == "ui" ) {
    switch ( $http_method ) {
      case "PUT":
      case "POST":
        $db->set_ui_options($data, $tbl_name, $params['column_name'], $params['ui_name']);
        break;
    }
    return $db->get_ui_options($tbl_name, $params['column_name'], $params['ui_name']);
  }

  //////////////////////////////////////////////////////////////////////////////
  // PREFERENCES, COULD EVENTUALLY MERGE WITH TABLE

  if ( $collection == "preferences" ) {

    switch ( $http_method ) {

      case "PUT":
        //This data should not be hardcoded.
        $id = $data['id'];
        $db->set_entry('directus_preferences', $data);
        //$db->insert_entry($tbl_name, $data, $id);
        break;

      case "POST":
        // This should not be hardcoded, needs to be corrected
        $data['user'] = 1;
        $id = $db->insert_entry($tbl_name, $data);
        $params['id'] = $id;
        break;
    }

    return $db->get_table_preferences( $tbl_name );
  }

  //////////////////////////////////////////////////////////////////////////////
  // SETTINGS

  if ( $collection == "settings" ) {

    switch ($http_method) {
      case "POST":
      case "PUT":
        $db->set_settings($data);
        break;
    }

    $result = $db->get_settings('global');
    if (isset($id)) return $result[$id];
    return $db->get_settings('global');
  }

  //////////////////////////////////////////////////////////////////////////////
  // MEDIA

  if ( $collection == "media" ) {

    switch ($http_method) {
      case "POST":
        $data['date_uploaded'] = gmdate('Y-m-d H:i:s');
        $params['id'] = $db->set_media($data);
        break;
      case "PATCH":
        $data['id'] = $id;
      case "PUT":
        if (!isset($id)) {
          $db->set_entries('directus_media', $data);
          break;
        }
        $db->set_media($data);
    }

    $result = $db->get_entries('directus_media', $params);

    return $result;
  }

}

//header('Access-Control-Allow-Origin: *');
//header("Access-Control-Allow-Methods: GET, POST, DELETE, PUT");
//header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept");
//header('Access-Control-Allow-Credentials: true');
//header("Content-Type: application/json; charset=utf-8");

// This is an api call
if (isset($collection)) {
  try {
    header("Content-Type: application/json; charset=utf-8");
    echo format_json(json_encode( request( $collection, $http_method, $params, $data ) ) );
  } catch (DirectusException $e){ 
    switch ($e->getCode()) {
      case 404:
        header("HTTP/1.0 404 Not Found");
        echo json_encode($e->getMessage());
        break;
    }
  } catch (Exception $e) {
    header("HTTP/1.1 500 Internal Server Error");
    //echo format_json(json_encode($e));
    echo print_r($e, true);
    //echo $e->getCode();
    //echo $e->getMessage();
  }
}









