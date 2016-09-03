<?php

define('INSTALLATION_PATH', dirname(__DIR__));

use Directus\Installation\Session;
use Directus\Installation\View;

$install_state = [];

/**
 * Get the installation default state values
 * @return array
 */
function install_get_default_state()
{
    return [
        'current_step' => 0,
        'steps' => [
            new \Directus\Installation\Steps\CheckRequirementsStep(),
            new \Directus\Installation\Steps\LanguageStep(),
            new \Directus\Installation\Steps\ProjectStep(),
            new \Directus\Installation\Steps\DatabaseStep(),
            new \Directus\Installation\Steps\ConfirmStep(),
        ],
        'settings' => [
            'views_path' => INSTALLATION_PATH . '/views/'
        ]
    ];
}

/**
 * Bootstrap installation
 * @param $root_path
 */
function install_directus($root_path)
{
    global $install_state;

    install_session_init($root_path);

    // add step query string
    $param_step = isset($_GET['step']) ? (int)$_GET['step'] : false;
    if ($param_step < 0) {
        $param_step = 0;

        install_redirect_step($param_step);
        exit;
    }

    if ($param_step === false) {
        Session::clear();
        $param_step = 0;

        install_redirect_step($param_step);
        exit;
    }

    // Get current step
    $install_step = install_get_step($param_step);
    $install_state['current_step'] = $install_step->getNumber();

    if (!install_can_do($param_step, $install_state)) {
        // Go to the next remaining step
        install_goto_step(false, $install_state);
        exit;
    }

    $executed = install_do($install_step, $install_state);
    if (!$executed) {
        View::displayStep($install_step, $install_state);
        Session::save($install_state);
    } else {
        Session::save($install_state);
        $install_step = install_get_step(($install_step->getNumber() + 1));
        if ($install_step == false) {
            if (install_confirmed()) {
                install_goto_directus($install_state);
            } else {
                install_redirect_step($param_step = 0);
            }
        } else {
            install_goto_step($install_step, $install_state);
        }
    }
}

/**
 * Get a step by number
 * @param int $step
 * @return bool
 */
function install_get_step($step)
{
    global $install_state;

    $steps = $install_state['steps'];

    return array_key_exists($step, $steps) ? $steps[$step] : false;
}

/**
 * Check if a given step has all previous step done.
 * @param $step
 * @param $state
 * @return bool
 */
function install_can_do($step, $state)
{
    if (!is_numeric($step)) {
        $step = $this->getNumber();
    }

    $step = (int)$step;

    // First step can be done anytime.
    if ($step == 0) {
        return true;
    }

    // There's not step done. can do this further step
    for ($number = 0; $number < $step; $number++) {
        $stepObject = install_get_step($number);
        if ($stepObject->isPending()) {
            return false;
        }
    }

    return true;
}

/**
 * Executes the given step
 * @param \Directus\Installation\Steps\StepInterface $step
 * @param $state
 * @return bool
 */
function install_do(\Directus\Installation\Steps\StepInterface $step, &$state)
{
    if ($_SERVER['REQUEST_METHOD'] == 'POST') {
        $response = $step->run($_POST, $step, $state);

        if ($response->isSuccessful()) {
            $step->setDone(true);
            return true;
        } else {
            $step->setDone(false);
            return false;
        }
    } else {
        $response = $step->preRun($state);
        if ($response && $response->isSuccessful()) {
            $step->setDone(true);
            return true;
        }
    }

    return false;
}

/**
 * Redirect to Directus
 * @param $state
 */
function install_goto_directus($state)
{
    Session::clear();
    header('Location: ' . $state['root_path']);
}

/**
 * Redirect to a given step or next pending step if step is null
 * @param $step
 * @param $state
 */
function install_goto_step($step, $state)
{
    if ($step === false) {
        foreach ($state['steps'] as $s) {
            if ($s->isPending()) {
                $step = $s;
                break;
            }
        }
    }

    if ($step instanceof \Directus\Installation\Steps\StepInterface) {
        $step = $step->getNumber() ? $step->getNumber() : 0;
    }

    $step = (int)$step;
    install_redirect_step($step);
}

/**
 * Redirect to a given step
 * @param $step
 */
function install_redirect_step($step)
{
    global $install_state;

    Session::save($install_state);

    header('Location: ' . install_url((int)$step));
}

/**
 * Get a given step request url
 * @param int $step
 * @return string
 */
function install_url($step = 0)
{
    global $install_state;

    $query_string = '?step=' . (int)$step;

    return rtrim($install_state['root_path'], '/') . '/installation/index.php' . $query_string;
}

/**
 * Checking if api config file existed
 * Assuming this file existed means installation was completed.
 * @return bool
 */
function install_confirmed()
{
    if (!file_exists('../api/config.php') || filesize('../api/config.php') == 0) {
        return false;
    }

    return true;
}

/**
 * Initialize for the first time the installation session
 * @param $root_path
 * @return void
 */
function install_session_init($root_path)
{
    global $install_state;

    if (session_status() == PHP_SESSION_NONE) {
        session_start();
    }

    $session = Session::read();
    if (empty($session)) {
        $install_state = install_get_default_state();
        foreach ($install_state['steps'] as $step) {
            $step->setDone(false);
        }
        $install_state['root_path'] = $root_path;

        // will set the global $install_state values
        // to the install session
        Session::save($install_state);
    } else {
        $install_state = $session;
    }
}
