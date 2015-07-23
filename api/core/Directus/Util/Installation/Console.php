<?php

namespace Directus\Util\Installation;

use Ruckusing\Framework as Ruckusing_Framework;

class Console
{
    private $command = '';
    private $options = array();
    private $dbh = null;
    private $directusPath = '';

    public function __construct($directusPath = '', $argv = array())
    {
        if (!$argv) {
            $argv = $_SERVER['argv'] ?: array();
        }

        // get rid of the command name
        array_shift($argv);

        $this->directusPath = $directusPath;

        $this->command = array_shift($argv);
        $this->options = $this->parseOptions($argv);

        $this->connectDatabase();
    }

    private function connectDatabase()
    {
        if (file_exists( $this->directusPath . '/api/config.php')) {
            require $this->directusPath . '/api/config.php';

            try {
                $this->dbh = new \PDO("mysql:host=".DB_HOST.";dbname=".DB_NAME, DB_USER, DB_PASSWORD);
            } catch(\Exception $e) {}
        }
    }

    public function run()
    {
        switch($this->command) {
            case 'config':
                echo "Creating config file" . PHP_EOL;
                $this->createConfig();
                break;
            case 'database':
                echo "Creating database" . PHP_EOL;
                $this->createDatabase();
                break;
            case 'install':
                echo "Installing Settings" . PHP_EOL;
                $this->install();
                break;
        }
    }

    private function createConfig()
    {
        require $this->directusPath . '/installation/config_setup.php';

        $options = $this->options;
        foreach($options as $key => $value) {
            switch($key) {
                case 'h':
                case 'host':
                    $options['db_host'] = $value;
                    unset($options[$key]);
                    break;
                case 'n':
                case 'name':
                    $options['db_name'] = $value;
                    unset($options[$key]);
                    break;
                case 'u':
                case 'user':
                    $options['db_user'] = $value;
                    unset($options[$key]);
                    break;
                case 'p':
                case 'pass':
                    $options['db_pass'] = $value;
                    unset($options[$key]);
                    break;
                case 'd':
                case 'dir':
                    $options['directus_path'] = $value;
                    unset($options[$key]);
                    break;
            }
        }

        WriteConfig($options, $this->directusPath);

        $this->clear();
    }

    private function createDatabase()
    {
        if (!file_exists($this->directusPath . '/api/config.php')) {
            echo "Config file does not exists, run [directus config]" . PHP_EOL;
            exit;
        }

        if (!file_exists($this->directusPath . '/api/ruckusing.conf.php')) {
            echo "Migration configuration file does not exists" . PHP_EOL;
            exit;
        }

        $config = require $this->directusPath . '/api/ruckusing.conf.php';
        $dbconfig = getDatabaseConfig(array(
          'type' => 'mysql',
          'host' => DB_HOST,
          'port' => 3306,
          'name' => DB_NAME,
          'user' => DB_USER,
          'pass' => DB_PASSWORD,
          'directory' => 'directus',
          'prefix' => '',
        ));

        $config = array_merge($config, $dbconfig);
        $main = new Ruckusing_Framework($config);

        $main->execute(array('', 'db:setup'));
        $main->execute(array('', 'db:migrate'));


        $this->clear();
    }

    private function install()
    {
        if (!file_exists($this->directusPath . '/api/config.php')) {
            echo "Config file does not exists, run [directus config]" . PHP_EOL;
            exit;
        }

        $options = $this->options;
        foreach($options as $key => $value) {
            switch($key) {
                case 'e':
                    $options['email'] = $value;
                    unset($options[$key]);
                    break;
                case 'p':
                    $options['pass'] = $value;
                    unset($options[$key]);
                    break;
                case 't':
                    $options['title'] = $value;
                    unset($options[$key]);
                    break;
            }
        }

        if (!isset($options['pass']) || !isset($options['email'])) {
            echo "Missing email or password" . PHP_EOL;
            exit;
        }

        if(!$this->dbh) {
            echo "Couldn't connect to the database." . PHP_EOL;
            exit;
        }

        $salt = uniqid();
        $composite = $salt . $options['pass'];
        $hash = sha1( $composite );

        $insert = "INSERT INTO directus_users (`id`, `active`, `email`, `password`, `salt`, `group`)
        VALUES
        (DEFAULT, 1, :email, :hash, :salt, 1);";

        $statement = $this->dbh->prepare($insert);
        $statement->bindParam(':email', $options['email']);
        $statement->bindParam(':hash', $hash);
        $statement->bindParam(':salt', $salt);
        $statement->execute();

        // Media paths
        $abspath = str_replace('\\', '/', dirname( dirname(__FILE__) ) . '/');
        $isHTTPS = false;
        if ((isset($_SERVER['HTTPS']) && !empty($_SERVER['HTTPS'])) ||
            (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443)) {
            $isHTTPS = true;
        }

        // $site_url = ($isHTTPS) ? "https://" : "http://" . $_SERVER['HTTP_HOST'] . DIRECTUS_PATH;
        // this does not work on CLI
        $site_url = DIRECTUS_PATH;

        $default_dest = $abspath.'media/';
        $default_url = $site_url.'media/';//
        $thumb_dest = $abspath.'media/thumbs/';
        $thumb_url = $site_url.'media/thumbs/';
        $temp_dest = $abspath.'media/temp/';
        $temp_url = $site_url.'media/temp/';

        $insert = "INSERT INTO `directus_storage_adapters` (`id`, `key`, `adapter_name`, `role`, `public`, `destination`, `url`, `params`)
        VALUES
            (1, 'files', 'FileSystemAdapter', 'DEFAULT', 1, '$default_dest', '$default_url', NULL),
            (2, 'thumbnails', 'FileSystemAdapter', 'THUMBNAIL', 1, '$thumb_dest', '$thumb_url', NULL),
            (3, 'temp', 'FileSystemAdapter', 'TEMP', 1, '$temp_dest', '$temp_url', NULL);";

        $statement = $this->dbh->prepare($insert);
        $statement->execute();

        $site_name = isset($options['title']) ? $options['title'] : '';
        $insert = "INSERT INTO `directus_settings` (`id`, `collection`, `name`, `value`)
                      VALUES
                      (1,'global','cms_user_auto_sign_out','60'),
                      (3,'global','project_name','".$site_name."'),
                      (4,'global','project_url','http://examplesite.dev/'),
                      (5,'global','cms_color','#7ac943'),
                      (6,'global','rows_per_page','200'),
                      (7,'files','storage_adapter','FileSystemAdapter'),
                      (8,'files','storage_destination',''),
                      (9,'files','thumbnail_storage_adapter','FileSystemAdapter'),
                      (10,'files','thumbnail_storage_destination',''),
                      (11,'files','thumbnail_quality','100'),
                      (12,'files','thumbnail_size','200'),
                      (13,'global','cms_thumbnail_url',''),
                      (14,'files','file_file_naming','file_id'),
                      (15,'files','file_title_naming','file_name'),
                      (16,'files','thumbnail_crop_enabled','1');";

        $statement = $this->dbh->prepare($insert);
        $statement->execute();

        $this->clear();
    }

    private function clear()
    {
        $this->command = '';
        $this->options = array();
    }

    private function parseOptions($argv)
    {
        $options = array();

        foreach($argv as $arg) {
            if(preg_match("/^(-{1,2})([A-Za-z0-9-_]+)(=)?([A-Za-z0-9-_@\.\ ]+)*$/", $arg, $argMatch)) {
                $value = '';
                if (count($argMatch) == 5) {
                    $value = $argMatch[4];
                }
                $key = $argMatch[2];

                $options[$key] = $value;
            }
        }

        return $options;
    }
}