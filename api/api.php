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

use Directus\View\JsonView;
use Directus\Collection\Users;
use Directus\Auth\Provider as AuthProvider;
use Directus\Auth\RequestNonceProvider;
use Directus\Auth\RequestNonceHasntBeenProcessed;

// Slim Middleware
use Directus\Middleware\MustBeLoggedIn;
use Directus\Middleware\MustHaveRequestNonce;

/**
 * Slim Bootstrap
 */

/**
 * @todo should set some ENV constant, i.e. DIRECTUS_ENV
 */
$app = new \Slim\Slim(array(
    'mode'    => 'development'
));

// Version shortcut for routes:
$v = API_VERSION;

/**
 * Middleware
 */

/* URL patterns which will not be protected by the following middleware */
$routeWhitelist = array("/^\/?$v\/auth\/?/");

$authProvider = new AuthProvider();
$app->add(new MustBeLoggedIn($routeWhitelist, $authProvider));

$requestNonceProvider = new RequestNonceProvider();
$app->add(new MustHaveRequestNonce($routeWhitelist, $requestNonceProvider));

/**
 * Globals
 */

$db = new DB(DB_USER, DB_PASSWORD, DB_NAME, DB_HOST);
$params = $_GET;
$requestPayload = json_decode($app->request()->getBody(), true);

/**
 * Slim Routes
 * (Collections arranged alphabetically)
 */

/**
 * AUTHENTICATION
 */

$app->post("/$v/auth/login/?", function() use ($app, $authProvider, $requestNonceProvider) {
    $response = array(
        'message' => "Wrong username/password.",
        'success' => false,
        'all_nonces' => $requestNonceProvider->getAllNonces()
    );
    if($authProvider::loggedIn()) {
        $response['success'] = true;
        return JsonView::render($response);
    }
    $req = $app->request();
    $email = $req->post('email');
    $password = $req->post('password');
    $user = Users::findOneByEmail($email);
    if(!$user) {
        return JsonView::render($response);
    }
    $response['success'] = $authProvider
        ->login($user['id'], $user['password'], $user['salt'], $password);
    if($response['success'])
        unset($response['message']);
    JsonView::render($response);
});

$app->get("/$v/auth/logout/?", function() use ($app, $authProvider) {
    if($authProvider::loggedIn())
        $authProvider::logout();
    $app->redirect(DIRECTUS_PATH . "login.php");
});

$app->get("/$v/auth/nonces/?", function() use ($app, $requestNonceProvider) {
    $all_nonces = $requestNonceProvider->getAllNonces();
    $response = array('nonces' => $all_nonces);
    JsonView::render($response);
});

/**
 * ACTIVITY COLLECTION
 */

$app->get("/$v/activity/?", function () use ($db) {
    $response = $db->get_activity();
    JsonView::render($response);
});

/**
 * COLUMNS COLLECTION
 */

// GET all table columns, or POST one new table column

$app->map("/$v/tables/:table/columns/?", function ($table) use ($db, $params, $requestPayload, $app) {
    $params['table_name'] = $table;
    if($app->request()->isPost()) {
        /* @TODO improves readability: use two separate methods for fetching one vs all entries */
        $params['column_name'] = $db->add_column($table, $requestPayload); // NOTE Alters the behavior of db#get_table below
    }
    $response = $db->get_table($table, $params);
    JsonView::render($response);
})->via('GET', 'POST');

// GET or PUT one column

$app->map("/$v/tables/:table/columns/:column/?", function ($table, $column) use ($db, $params, $requestPayload, $app) {
    $params['column_name'] = $column;
    $params['table_name'] = $table;
    // Add table name to dataset. @TODO more clarification would be useful
    foreach ($requestPayload as &$row) {
        $row['table_name'] = $table;
    }
    if($app->request()->isPut()) {
        $db->set_entries('directus_columns', $requestPayload);
    }
    $response = $db->get_table($table, $params);
    JsonView::render($response);
})->via('GET', 'PUT');

/**
 * ENTRIES COLLECTION
 */

$app->map("/$v/tables/:table/rows/?", function ($table) use ($db, $params, $requestPayload, $app) {
    $id = null;
    $params['table_name'] = $table;
    switch($app->request()->getMethod()) {
        // POST one new table entry
        case 'POST':
            $id = $db->set_entry_relational($table, $requestPayload);
            $params['id'] = $id;
            break;
        // PUT a change set of table entries
        case 'PUT':
            $db->set_entries($table, $requestPayload);
            break;
    }
    // GET all table entries
    $response = $db->get_entries($table, $params);
    JsonView::render($response);
})->via('GET', 'POST', 'PUT');

$app->map("/$v/tables/:table/rows/:id/?", function ($table, $id) use ($db, $params, $requestPayload, $app) {
    $params['table_name'] = $table;
    switch($app->request()->getMethod()) {
        // PUT an updated table entry
        case 'PUT':
            $db->set_entry_relational($table, $requestPayload);
            break;
        // DELETE a given table entry
        case 'DELETE':
            echo $db->delete($table, $id);
            return;
    }
    $params['id'] = $id;
    // GET a table entry
    $response = $db->get_entries($table, $params);
    JsonView::render($response);
})->via('DELETE', 'GET', 'PUT');

/**
 * GROUPS COLLECTION
 */

/** (Optional slim route params break when these two routes are merged) */

$app->get("/$v/groups/?", function () use ($db) {
    // @TODO need POST and PUT
    $response = $db->get_entries("directus_groups");
    JsonView::render($response);
});

$app->get("/$v/groups/:id/?", function ($id = null) use ($db) {
    // @TODO need POST and PUT
    // Hardcoding ID temporarily
    is_null($id) ? $id = 1 : null ;
    $response = $db->get_group($id);
    JsonView::render($response);
});

/**
 * MEDIA COLLECTION
 */

$app->map("/$v/media(/:id)/?", function ($id = null) use ($db, $params, $requestPayload, $app) {

    $params['id'] = $id;

    // A URL is specified. Upload the file
    if (isset($requestPayload['url']) && $requestPayload['url'] != "") {
        $media = new Media($requestPayload['url'], RESOURCES_PATH);
        $media_data = $media->data();
        $requestPayload['type'] = $media_data['type'];
        $requestPayload['charset'] = $media_data['charset'];
        $requestPayload['size'] = $media_data['size'];
        $requestPayload['width'] = $media_data['width'];
        $requestPayload['height'] = $media_data['height'];
        $requestPayload['name'] = $media_data['name'];
        $requestPayload['date_uploaded'] = $media_data['date_uploaded'];
        if (isset($media_data['embed_id'])) {
            $requestPayload['embed_id'] = $media_data['embed_id'];
        }
    }

    if (isset($requestPayload['url']))
        unset($requestPayload['url']);

    /** Attribute these actions to the authenticated user. */
    if(!empty($requestPayload) && !is_numeric_array($requestPayload)) {
        $currentUser = AuthProvider::getUserInfo();
        $requestPayload['user'] = $currentUser['id'];
    }

    $table = "directus_media";
    switch ($app->request()->getMethod()) {
        case "POST":
            $requestPayload['date_uploaded'] = gmdate('Y-m-d H:i:s');
            $params['id'] = $db->set_media($requestPayload);
            break;
        case "PATCH":
            $requestPayload['id'] = $id;
        case "PUT":
            if (!is_null($id)) {
                $db->set_entries($table, $requestPayload);
                break;
            }
            $db->set_media($requestPayload);
            break;
    }

    $response = $db->get_entries($table, $params);
    JsonView::render($response);
})->via('GET','PATCH','POST','PUT');

/**
 * PREFERENCES COLLECTION
 */

$app->map("/$v/tables/:table/preferences/?", function($table) use ($db, $params, $requestPayload, $app) {
    $params['table_name'] = $table;
    switch ($app->request()->getMethod()) {
        case "PUT":
            //This data should not be hardcoded.
            $id = $requestPayload['id'];
            $db->set_entry('directus_preferences', $requestPayload);
            //$db->insert_entry($table, $requestPayload, $id);
            break;
        case "POST":
            // This should not be hardcoded, needs to be corrected
            $requestPayload['user'] = 1;
            $id = $db->insert_entry($table, $requestPayload);
            $params['id'] = $id;
            break;
    }
    $response = $db->get_table_preferences($table);
    JsonView::render($response);
})->via('GET','POST','PUT');

/**
 * REVISIONS COLLECTION
 */

$app->get("/$v/tables/:table/rows/:id/revisions/?", function($table, $id) use ($db, $params) {
    $params['table_name'] = $table;
    $params['id'] = $id;
    $response = $db->get_revisions($params);
    JsonView::render($response);
});

/**
 * SETTINGS COLLECTION
 */

$app->map("/$v/settings(/:id)/?", function ($id = null) use ($db, $params, $requestPayload, $app) {
    switch ($app->request()->getMethod()) {
        case "POST":
        case "PUT":
            $db->set_settings($requestPayload);
            break;
    }
    $settings = $db->get_settings('global');
    $response = is_null($id) ? $settings : $settings[$id];
    JsonView::render($response);
})->via('GET','POST','PUT');

/**
 * TABLES COLLECTION
 */

// GET table index
$app->get("/$v/tables/?", function () use ($db, $params, $requestPayload) {
    $response = $db->get_tables($params);
    JsonView::render($response);
})->name('table_index');

// GET and PUT table details
$app->map("/$v/tables/:table/?", function ($table) use ($db, $params, $requestPayload, $app) {
    /* PUT updates the table */
    if($app->request()->isPut()) {
        $db->set_table_settings($requestPayload);
    }
    $response = $db->get_table_info($table, $params);
    JsonView::render($response);
})->via('GET', 'PUT')->name('table_detail');

/**
 * UPLOAD COLLECTION
 */

$app->post("/$v/upload/?", function () use ($db, $params, $requestPayload, $app) {
    $result = array();
    foreach ($_FILES as $file) {
      $media = new Media($file, RESOURCES_PATH);
      array_push($result, $media->data());
    }
    JsonView::render($result);
});

/**
 * USERS COLLECTION
 */

// GET user index
$app->get("/$v/users/?", function () use ($db, $params, $requestPayload) {
    $users = Users::getAllWithGravatar();
    JsonView::render($users);
})->name('user_index');

// POST new user
$app->post("/$v/users/?", function() use ($db, $params, $requestPayload) {
    $table = 'directus_users';
    $id = $db->set_entries($table, $params);
    $params['id'] = $id;
    $response = $db->get_entries($table, $params);
    JsonView::render($response);
})->name('user_post');

// GET or PUT a given user
$app->map("/$v/users/:id/?", function ($id) use ($db, $params, $requestPayload, $app) {
    $table = 'directus_users';
    $params['id'] = $id;
    if($app->request()->isPut()) {
        $db->set_entry($table, $requestPayload);
    }
    $response = $db->get_entries($table, $params);
    JsonView::render($response);
})->via('GET', 'PUT');

/**
 * UI COLLECTION
 */

// $app->map("/$v/tables/:table/ui/?", function($table) use ($db, $params, $requestPayload, $app) {
//     $params['table_name'] = $table;
//     switch ($app->request()->getMethod()) {
//       case "PUT":
//       case "POST":
//         $db->set_ui_options($requestPayload, $table, $params['column_name'], $params['ui_name']);
//         break;
//     }
//     $response = $db->get_ui_options($table, $params['column_name'], $params['ui_name']);
//     JsonView::render($response);
// })->via('GET','POST','PUT');

$app->map("/$v/tables/:table/columns/:column/:ui/?", function($table, $column, $ui) use ($db, $params, $requestPayload, $app) {
    $params['table_name'] = $table;
    $params['column_name'] = $column;
    $params['ui_name'] = $ui;
    switch ($app->request()->getMethod()) {
      case "PUT":
      case "POST":
        $db->set_ui_options($requestPayload, $table, $column, $ui);
        break;
    }
    $response = $db->get_ui_options($table, $column, $ui);
    JsonView::render($response);
})->via('GET','POST','PUT');


/**
 * Run the Router
 */

if(isset($_GET['run_api_router']) && $_GET['run_api_router']) {
    try {
        // Run Slim
        $app->response()->header('Content-Type', 'application/json; charset=utf-8');
        $app->run();
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