<?php

/**
 * Initialization
 *  - Apparently the autoloaders must be registered separately in both index.php and api.php
 */
// Composer Autoloader
require 'vendor/autoload.php';
// Directus Autoloader
use Symfony\Component\ClassLoader\UniversalClassLoader;
$loader = new UniversalClassLoader();
$loader->registerNamespace("Directus", dirname(__FILE__) . "/core/");
$loader->register();
// Non-autoload components
require dirname(__FILE__) . '/config.php';
require dirname(__FILE__) . '/core/db.php';
require dirname(__FILE__) . '/core/media.php';
require dirname(__FILE__) . '/core/functions.php';
/* End initialization */

// @TODO probably should set this in config
define('API_VERSION', 1);

/**
 * Slim Bootstrap
 */

// @TODO should set some ENV constant, i.e. DIRECTUS_ENV

$app = new \Slim\Slim(array(
    'mode'    => 'development'
));

$db = new DB(DB_USER, DB_PASSWORD, DB_NAME, DB_HOST);
$params = $_GET;
$data = json_decode(file_get_contents('php://input'), true);

/**
 * Slim Routes
 * (Collections arranged alphabetically)
 */

// Version shortcut for router:
$V = API_VERSION;

/**
 * ACTIVITY COLLECTION
 */

$app->get("/$V/activity/", function () use ($db, $params, $data, $app) {
    $response = $db->get_activity();
    \Directus\View\JsonView::render($response);
});

/**
 * COLUMNS COLLECTION
 */

// GET all table columns, or POST one new table column

$app->map("/$V/tables/:table/columns", function ($table) use ($db, $params, $data, $app) {
    if($app->request()->isPost()) {
        /* @TODO improves readability: use two separate methods for fetching one vs all entries */
        $params['column_name'] = $db->add_column($table, $data); // NOTE Alters the behavior of db#get_table below
    }
    $response = $db->get_table($table, $params);
    \Directus\View\JsonView::render($response);
})->via('GET', 'POST');

// GET or PUT one column

$app->map("/$V/tables/:table/columns/:column", function ($table, $column) use ($db, $params, $data, $app) {
    $params['column_name'] = $column;
    // Add table name to dataset. @TODO more clarification would be useful
    foreach ($data as &$row) {
        $row['table_name'] = $table;
    }
    if($app->request()->isPut()) {
        $db->set_entries('directus_columns', $data);
    }
    $response = $db->get_table($table, $params);
    \Directus\View\JsonView::render($response);
})->via('GET', 'PUT');

/**
 * ENTRIES COLLECTION
 */

$app->map("/$V/tables/:table/rows", function ($table) use ($db, $params, $data, $app) {
    $id = null;
    switch($app->request()->getMethod()) {
        // POST one new table entry
        case 'POST':
            $id = $db->set_entry_relational($table, $data);
            $params['id'] = $id;
            break;
        // PUT a change set of table entries
        case 'PUT':
            $db->set_entries($table, $data);
            break;
    }
    // GET all table entries
    $response = $db->get_entries($table, $params);
    \Directus\View\JsonView::render($response);
})->via('GET', 'POST', 'PUT');

$app->map("/$V/tables/:table/rows/:id", function ($table, $id) use ($db, $params, $data, $app) {
    switch($app->request()->getMethod()) {
        // PUT an updated table entry
        case 'PUT':
            $db->set_entry_relational($table, $data);
            break;
        // DELETE a given table entry
        case 'DELETE':
            echo $db->delete($table, $id);
            return;
    }
    // GET a table entry
    $response = $db->get_entries($table, $params);
    \Directus\View\JsonView::render($response);
})->via('DELETE', 'GET', 'PUT');

/**
 * GROUPS COLLECTION
 */

/** (Optional slim route params break when these two routes are merged) */

$app->get("/$V/groups", function () use ($db, $params, $data, $app) {
    // @TODO need POST and PUT
    $response = $db->get_entries("directus_groups");
    \Directus\View\JsonView::render($response);
});

$app->get("/$V/groups/:id", function ($id = null) use ($db, $params, $data, $app) {
    // @TODO need POST and PUT
    // Hardcoding ID temporarily
    is_null($id) ? $id = 1 : null ;
    $response = $db->get_group($id);
    \Directus\View\JsonView::render($response);
});

/**
 * MEDIA COLLECTION
 */

$app->map("/$V/media(/:id)", function ($id = null) use ($db, $params, $data, $app) {

    // A URL is specified. Upload the file
    if (isset($data['url']) && $data['url'] != "") {
        $media = new Media($data['url'], RESOURCES_PATH);
        $media_data = $media->data();
        $data['type'] = $media_data['type'];
        $data['charset'] = $media_data['charset'];
        $data['size'] = $media_data['size'];
        $data['width'] = $media_data['width'];
        $data['height'] = $media_data['height'];
        $data['name'] = $media_data['name'];
        $data['date_uploaded'] = $media_data['date_uploaded'];
        if (isset($media_data['embed_id'])) {
            $data['embed_id'] = $media_data['embed_id'];
        }
    }

    if (isset($data['url']))
        unset($data['url']);

    $table = "directus_media";
    switch ($app->request()->getMethod()) {
        case "POST":
            $data['date_uploaded'] = gmdate('Y-m-d H:i:s');
            $params['id'] = $db->set_media($data);
            break;
        case "PATCH":
            $data['id'] = $id;
        case "PUT":
            if (!isset($id)) {
                $db->set_entries($table, $data);
                break;
            }
            $db->set_media($data);
            break;
    }

    $response = $db->get_entries($table, $params);
    \Directus\View\JsonView::render($response);
})->via('GET','PATCH','POST','PUT');

/**
 * PREFERENCES COLLECTION
 */

$app->map("/$V/tables/:table/preferences", function($table) use ($db, $params, $data, $app) {
    $params['table_name'] = $table;
    switch ($app->request()->getMethod()) {
        case "PUT":
            //This data should not be hardcoded.
            $id = $data['id'];
            $db->set_entry('directus_preferences', $data);
            //$db->insert_entry($table, $data, $id);
            break;
        case "POST":
            // This should not be hardcoded, needs to be corrected
            $data['user'] = 1;
            $id = $db->insert_entry($table, $data);
            $params['id'] = $id;
            break;
    }
    $response = $db->get_table_preferences($table);
    \Directus\View\JsonView::render($response);
})->via('GET','POST','PUT');

/**
 * REVISIONS COLLECTION
 */

$app->get("/$V/tables/:table/rows/:id/revisions", function($table, $id) use ($db, $params, $data, $app) {
    $params['table_name'] = $table;
    $params['id'] = $id;
    $response = $db->get_revisions($params);
    \Directus\View\JsonView::render($response);
});

/**
 * SETTINGS COLLECTION
 */

$app->map("/$V/settings(/:id)", function ($id = null) use ($db, $params, $data, $app) {
    switch ($http_method) {
        case "POST":
        case "PUT":
            $db->set_settings($data);
            break;
    }
    $all_settings = $db->get_settings('global');
    $response = is_null($id) ? $all_settings : $result[$id];
    \Directus\View\JsonView::render($response);
})->via('GET','POST','PUT');

/**
 * TABLES COLLECTION
 */

// GET table index
$app->get("/$V/tables", function () use ($db, $params, $data) {
    $response = $db->get_tables($params);
    \Directus\View\JsonView::render($response);
})->name('table_index');

// GET and PUT table details
$app->map("/$V/tables/:table", function ($table) use ($db, $params, $data, $app) {
    /* PUT updates the table */
    if($app->request()->isPut()) {
        $db->set_table_settings($data);
    }
    $response = $db->get_table_info($table, $params);
    \Directus\View\JsonView::render($response);
})->via('GET', 'PUT')->name('table_detail');

/**
 * UPLOAD COLLECTION
 */

$app->post("/$V/upload", function () use ($db, $params, $data, $app) {
    $result = array();
    foreach ($_FILES as $file) {
      $media = new Media($file, RESOURCES_PATH);
      array_push($result, $media->data());
    }
    \Directus\View\JsonView::render($result);
});

/**
 * USERS COLLECTION
 */

// GET user index
$app->get("/$V/users", function () use ($db, $params, $data) {
    $users = \Directus\Collections\Users::getAllWithGravatar();
    \Directus\View\JsonView::render($users);
})->name('user_index');

// POST new user
$app->post("/$V/users", function() use ($db, $params, $data) {
    $table = 'directus_users';
    $id = $db->set_entries($table, $params);
    $params['id'] = $id;
    $response = $db->get_entries($table, $params);
    \Directus\View\JsonView::render($response);
})->name('user_post');

// GET or PUT a given user
$app->map("/$V/users/:id", function ($id) use ($db, $params, $data, $app) {
    $table = 'directus_users';
    $params['id'] = $id;
    if($app->request()->isPut()) {
        $db->set_entry($table, $data);
    }
    $response = $db->get_entries($table, $params);
    \Directus\View\JsonView::render($response);
})->via('GET', 'PUT');

/**
 * UI COLLECTION
 */

$app->map("/$V/tables/:table/ui", function($table) use ($db, $params, $data, $app) {
    switch ($app->request()->getMethod()) {
      case "PUT":
      case "POST":
        $db->set_ui_options($data, $table, $params['column_name'], $params['ui_name']);
        break;
    }
    $response = $db->get_ui_options($table, $params['column_name'], $params['ui_name']);
    \Directus\View\JsonView::render($response);
})->via('GET','POST','PUT');


/**
 * Run the Router
 */

if(isset($_GET['run_api_router']) && $_GET['run_api_router']) {
    try {
        header("Content-Type: application/json; charset=utf-8");
        // Run Slim
        $app->run();
        // var_dump($app->request());
        // exit;
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