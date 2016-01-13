<?php

define('INSTALLATION_PATH', dirname(__DIR__));

$install_state = [];

/**
 * Get the installation default state values
 * @return array
 */
function install_get_default_state() {
    return [
        'current_step' => 0,
        'steps' => [
            [
                'number' => 0,
                'name' => 'welcome',
                'title' => 'Install Directus',
                'view_name' => 'welcome.php'
            ],[
                'number' => 1,
                'name' => 'project_info',
                'title' => 'Project Info',
                'view_name' => 'project_info.php'
            ],
        ],
        'settings' => [
            'views_path' => INSTALLATION_PATH.'/views/'
        ]
    ];
}

function install_directus($root_path) {
    global $install_state;
// install_session_clear();

    install_session_init($root_path);
    // echo '<pre>'; var_dump($install_state); echo '</pre>';

    // add step query string
    $param_step = isset($_GET['step']) ? (int)$_GET['step'] : false;
    if ($param_step === false) {
        install_session_clear();
        return install_redirect_step($param_step);
    }

    // current step
    $install_step = install_get_next_step($install_state);
    $install_state['current_step'] = $install_step['number'];

    // check if the current step is different from query string step
    // if so, redirect to the query string step number
    if ($param_step !== $install_step['number']) {
        $install_step = install_get_step($param_step);
        if (!$install_step) {
            install_redirect_step(false);
        }
        $install_state['current_step'] = $param_step;
    }

    if ($install_step == false) {
        if (install_confirmed()) {
            return install_goto_directus($install_state);
        }

        install_session_clear();
        exit('There is not task to execute.');
    }

    if (!install_can_do($param_step, $install_state)) {
        // go to the next remaning step
        install_goto_step(false, $install_state);
    }
// echo '<pre>'; print_r($install_step); echo '</pre>';
    // var_dump($executed);
    $executed = install_do($install_step, $install_state);
    install_session_save();

    if ($executed) {
        $install_step = install_get_next_step($install_state);
        if ($install_step == false) {
            install_session_clear();
            return install_goto_directus($install_state);
        }

        // if ($executed) {
        return install_goto_step(false, $install_state);
        // }
    }

    // if ($executed === true) {
    //     $_SESSION['install_state'] = $install_state;
    //     return install_goto_step(false, $install_state);
    // }
    //
    // $install_step = install_get_next_step($install_state);
    // var_dump($install_step);
    // if ($install_step == false) {
    //     install_goto_directus($install_step);
    //     unset($_SESSION['install_state']);
    // }

    display_step($install_step, $install_state);
}

function install_get_step($step) {
    global $install_state;

    $steps = $install_state['steps'];
    return array_key_exists($step, $steps) ? $steps[$step] : false;
}

function install_get_next_step($state) {
    $remaning = $state['steps_remaning'];

    if (count($remaning) > 0) {
        return current($remaning);
    }

    return false;
}

function install_can_do($step, $state) {
    if (is_array($step)) {
        $step = isset($step['number']) ? $step['number'] : 0;
    }

    $step = (int)$step;
    // First step can be done anytime.
    if ($step === 0) {
        return true;
    }

    // There's not step done. can do this further step
    if (count($state['steps_done']) === 0) {
        return false;
    }

    // Check if the previous steps are all done.
    for($s = 0; $s < $step; $s++) {
        if (array_key_exists($s, $state['steps_done'])) {
            return true;
        }
    }

    return false;
}

function install_do(array $step, &$state) {
    if (!empty($_POST)) {
        $done = call_user_func('install_do_step_'.$step['name'], $_POST, $step, $state);
        if ($done) {
            $step_done = array_shift($state['steps_remaning']);
            $state['steps_done'][] = $step_done;
        }

        return true;
    }

    return false;
}

function install_goto_directus($state) {
    header('Location: '.$state['root_path']);
}

function install_goto_step($step, $state) {
    if ($step === false) {
        $step = current($state['steps_remaning']);
    }

    if (is_array($step)) {
        $step = isset($step['number']) ? $step['number'] : 0;
    }

    $step = (int)$step;
    install_redirect_step($step);
}

function install_redirect_step($step) {
    header('Location: '.install_url((int)$step));
}

function install_url($step = 0) {
    global $install_state;

    $query_string = '?step='.(int)$step;

    return rtrim($install_state['root_path'], '/').'/installation/index.php'.$query_string;
}

function display_step($step, $state) {
    $output = get_step_view($state, $step);

    $view_path = $state['settings']['views_path'];
    echo get_view($view_path.'/base.php', array_merge(
            $state,
            ['step' => $step, 'content' => $output]
        )
    );
}

function install_do_step_welcome($data, $step, &$state) {
    $start = isset($data['start']) ? $data['start'] : false;
    if ($start === "true") {
        install_step_set_data($data, $step, $state);
        return true;
    }

    return false;
}

function install_step_set_data($data, $step, &state);

/**
 * Checking if api config file existed
 * Assuming this file existed means installation was completed.
 * @return bool
 */
function install_confirmed() {
    if (!file_exists('../api/config.php') || filesize('../api/config.php') == 0) {
        return false;
    }

    return true;
}

/**
 * Get the template rendered content
 * @param  array $step Step information
 * @param  array $data Data to be injected in the views
 * @return string       view output content
 */
function get_step_view($state, $step, array $data = []) {
    $view_path = $state['settings']['views_path'];
    $data = array_merge($state, $data);
    return get_view($view_path.'/'.$step['view_name'], $data);
}

/**
 * Get the view rendered content
 * @param  string $path view path
 * @param  array $data Data to be injected in the views
 * @return string       view output content
 */
function get_view($path, $data = []) {
    $render = function($path, $data) {
        extract($data);
        include $path;
    };

    ob_start();
    $render($path, $data);
    return ob_get_clean();
}

/**
 * Initialize for the first time the installation session
 * @return void
 */
function install_session_init($root_path) {
    global $install_state;

    if (session_status() == PHP_SESSION_NONE) {
        session_start();
    }

    $session = install_session_read();
    if (empty($session)) {
        $install_state = install_get_default_state();
        $install_state['steps_remaning'] = $install_state['steps'];
        $install_state['steps_done'] = [];
        $install_state['root_path'] = $root_path;

        // will set the global $install_state values
        // to the install session
        install_session_save();
    } else {
        $install_state = $session;
    }
}

/**
 * Get the installation session
 * @return [type] [description]
 */
function install_session_read() {
    return isset($_SESSION['install_state']) ? $_SESSION['install_state'] : [];
}

/**
 * Delete installation state session
 * @return [type] [description]
 */
function install_session_clear() {
    unset($_SESSION['install_state']);
}

/**
 * Save the session state from global variable
 * @return void
 */
function install_session_save() {
    global $install_state;

    $_SESSION['install_state'] = $install_state;
}
