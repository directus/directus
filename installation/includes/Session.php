<?php

namespace Directus\Installation;

class Session
{
    /**
     * Get the installation session
     * @param string $key
     * @return array
     */
    static public function read($key = null)
    {
        $session = [];
        if (isset($_SESSION['install_state'])) {
            $session = unserialize($_SESSION['install_state']);
        }

        if ($key != null) {
            return array_key_exists($key, $session) ? $session[$key] : null;
        }

        return isset($session) ? $session : null;
    }

    /**
     * Delete installation state session
     *
     * @return void
     */
    static public function clear()
    {
        if (isset($_SESSION['install_state'])) {
            unset($_SESSION['install_state']);
        }
    }

    /**
     * Save the session state from global variable
     *
     * @param $state
     * @return void
     */
    static public function save($state)
    {
        $_SESSION['install_state'] = serialize($state);
    }
}
