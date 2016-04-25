<?php
ob_start();
session_start();
require '../api/globals.php';

$code = 0;
$errorString = null;
$bad_paths = array();
$assetsVersion = defined('DIRECTUS_VERSION') ? DIRECTUS_VERSION : date('Ymd', time());

if(isset($_SESSION['step'])) {
    $step = $_SESSION['step'];
} else {
    $step = 1;
}

if(isset($_POST['backButton'])) {
    if($step > 0) {
        $step--;
        $_SESSION['step'] = $step;
    }
}

if($step == 1 && isset($_POST['email']) && isset($_POST['site_name']) && isset($_POST['password']) && isset($_POST['password_confirm'])) {
    if(!empty($_POST['email']) && !empty($_POST['site_name']) && !empty($_POST['password']) && !empty($_POST['directus_path'])) {
        if($_POST['password'] == $_POST['password_confirm'] && strlen($_POST['password']) > 0) {
            $_SESSION['email'] = $_POST['email'];
            $_SESSION['site_name'] = $_POST['site_name'];
            $_SESSION['password'] = $_POST['password'];
            $_SESSION['directus_path'] = $_POST['directus_path'];
            $_SESSION['step'] = 2;
            $step = 2;
        }
    }
}

if($step == 2 && isset($_POST['host_name']) && isset($_POST['username']) && isset($_POST['db_name'])) {
    //Check for db connection
    ini_set('display_errors', 0);
    $conn = mysqli_init();
    mysqli_options($conn, MYSQLI_OPT_CONNECT_TIMEOUT, 5);
    $connection = mysqli_real_connect($conn, $_POST['host_name'], $_POST['username'], $_POST['password'], $_POST['db_name'], $_POST['port']);
    $_SESSION['database'] = $_POST['database'];
    $_SESSION['host_name'] = $_POST['host_name'];
    $_SESSION['username'] = $_POST['username'];
    $_SESSION['db_password'] = $_POST['password'];
    $_SESSION['db_name'] = $_POST['db_name'];
    $_SESSION['port'] = $_POST['port'];
    $_SESSION['db_prefix'] = '';//$_POST['db_prefix'];
    if(isset($_POST['initial_schema'])) {
        $_SESSION['initial_schema'] = $_POST['initial_schema'];
    } else {
        $_SESSION['initial_schema'] = "none";
    }
    if($connection) {
        $_SESSION['step'] = 3;
        $step = 3;
    } else {
        $code = mysqli_connect_errno();
    }
}

if($step == 3 && isset($_POST['install'])) {
    if(isset($_POST['send_config_email'])) {
        $_SESSION['send_config_email'] = $_POST['send_config_email'];
    } else {
        $_SESSION['send_config_email'] = "no";
    }
    $_SESSION['step'] = 4;
    $step = 4;

    // Media paths
    $abspath = str_replace('\\', '/', dirname( dirname(__FILE__) ) . '/');
    $isHTTPS = false;
    if ((isset($_SERVER['HTTPS']) && !empty($_SERVER['HTTPS'])) ||
            (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443)) {
        $isHTTPS = true;
    }

    $site_url = ($isHTTPS) ? "https://" : "http://" . $_SERVER['HTTP_HOST'] . $_SESSION['directus_path'];

    $_SESSION['default_dest'] = $abspath.'media/';
    $_SESSION['default_url'] = $site_url.'media/';//
    $_SESSION['thumb_dest'] = $abspath.'media/thumbs/';
    $_SESSION['thumb_url'] = $site_url.'media/thumbs/';
    $_SESSION['temp_dest'] = $abspath.'media/temp/';
    $_SESSION['temp_url'] = $site_url.'media/temp/';
}
?><!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />

    <title>Install Directus</title>
    <meta name="description" content="Directus">
    <meta name="author" content="RANGER Studio LLC">

    <link rel='shortcut icon' type='image/x-icon' href='/favicon.ico' />
    <link rel="stylesheet" href="//fonts.googleapis.com/css?family=Roboto:300,400,600" type="text/css">
    <link rel="stylesheet" href="install.css?v=<?=$assetsVersion;?>">
</head>
<body>
<form name="input" action="index.php" method="post">

    <div class="header">
        <img src="directus-logo.png">
        <h1>Install Directus</h1>
        <div class="breadcrumb">
            <span class="<?PHP if($step == 1){echo "current";} elseif($step > 1){echo "complete";}?>">1. Project</span>
            <span class="separator">●</span>
            <span class="<?PHP if($step == 2){echo "current";} elseif($step > 2){echo "complete";}?>">2. Database</span>
            <span class="separator">●</span>
            <span class="<?PHP if($step == 3){echo "current";} elseif($step > 3){echo "complete";}?>">3. Confirm</span>
        </div>
    </div>
    <div class="container">
        <?php
        if($step == 1) {
            $error = null;
            if (version_compare(PHP_VERSION, '5.4.0', '<')) {
                $error = 'Your host needs to use PHP 5.4.10 or higher to run this version of Directus!';
            }

            if (!defined('PDO::ATTR_DRIVER_NAME')) {
                $error = 'Your host needs to have PDO enabled to run this version of Directus!';
            }

            if (!extension_loaded('gd') || !function_exists('gd_info')) {
                $error = 'Your host needs to have GD Library enabled to run this version of Directus!';
            }

            if($error) {
                // Set HEADER to "Missing Requirements"
                ?>
                    <div class="container">
                        <h2><?php echo($error); ?></h2>
                <?php
                die();
            } else {
                $directus_path = preg_replace('#/(installation/.*)#i', '', $_SERVER['REQUEST_URI']) . '/';
                ?>
                <div class="container">
                    <label for="site_name">Project Name</label><input type="text" id="site_name" name="site_name" placeholder="My Project Name" value="<?php echo(isset($_SESSION['site_name']) ? $_SESSION['site_name'] : ''); ?>" autofocus><br>
                    <label for="directus_path">Project Path</label><input type="text" id="directus_path" name="directus_path" placeholder="Path to Directus directory" value="<?php echo(isset($_SESSION['directus_path']) ? $_SESSION['directus_path'] : $directus_path); ?>"><br>
                    <label for="email">Admin Email</label><input type="email" id="email" name="email" placeholder="admin@example.com" value="<?php echo(isset($_SESSION['email']) ? $_SESSION['email'] : ''); ?>"><br>
                    <label for="password">Admin Password</label><input type="password" id="password" name="password" value="<?php echo(isset($_SESSION['password']) ? $_SESSION['password'] : ''); ?>"><br>
                    <label for="password_confirm">Confirm Admin Password</label><input type="password" id="password_confirm" name="password_confirm" value="<?php echo(isset($_SESSION['password']) ? $_SESSION['password'] : ''); ?>"><br>
                </div>
            <?php
            }
        }

        if($step == 2) {
            ?>
            <div class="step-2">
                <?php if ($code!==0) { ?>
                    <div class="error-container">
                        There was an error while attempting to connect to the database. Please review the above configuration and try again.
                    </div>
                <?php } ?>
                <label for="database">Database</label>
                <select name="database" id="database">
                    <option value="mysql" <?php echo(isset($_SESSION['database']) && $_SESSION['database'] == 'mysql' ? 'checked' : ''); ?>>MySQL/Percona</option>
                </select>
                <label for="host_name">Host Name</label><input type="text" id="host_name" placeholder="eg: localhost" class="<?php if($code == 2002){echo "error";}?>" name="host_name" value="<?php echo(isset($_SESSION['host_name']) ? $_SESSION['host_name'] : 'localhost'); ?>" autofocus><br>
                <label for="username">Username</label><input type="text" id="username" placeholder="With access/modify privileges" class="<?php if($code == 1045){echo "error";}?>" name="username" value="<?php echo(isset($_SESSION['username']) ? $_SESSION['username'] : ''); ?>"><br>
                <label for="password">Password</label><input type="password" id="password" placeholder="" class="<?php if($code == 1045){echo "error";}?>" name="password" value="<?php echo(isset($_SESSION['db_password']) ? $_SESSION['db_password'] : ''); ?>"><br>
                <label for="db_name">Database Name</label><input type="text" id="db_name" placeholder="" class="<?php if($code == 1049){echo "error";}?>" name="db_name" value="<?php echo(isset($_SESSION['db_name']) ? $_SESSION['db_name'] : ''); ?>"><br>
                <label for="port">Port</label><input type="text" id="port" placeholder="3306" class="<?php if($code == 2002){echo "error";}?>" name="port" value="<?php echo(isset($_SESSION['port']) ? $_SESSION['port'] : '3306'); ?>"><br>
                <label for="initial_schema">Initial Schema</label>
                <select name="initial_schema" id="initial_schema">
                    <option value="none" <?php echo(isset($_SESSION['initial_schema']) && $_SESSION['initial_schema'] == 'none' ? 'checked' : ''); ?>>None (Blank Database)</option>
                    <option value="ui_gallery" <?php echo(isset($_SESSION['initial_schema']) && $_SESSION['initial_schema'] == 'ui_gallery' ? 'checked' : ''); ?>>UI Gallery</option>
                </select>
            </div>
            <?php
        }

        if($step == 3) {
            ?>
            <div class="step-3">
                <h3>Main Configuration</h3>
                <hr>
                <table>
                    <tbody>
                    <tr>
                        <td class="item">Site Name</td>
                        <td class="result"><?php echo $_SESSION['site_name'];?></td>
                    </tr>
                    <tr>
                        <td class="item">Admin Email</td>
                        <td class="result"><span><?php echo $_SESSION['email'];?></span>
                        </td>
                    </tr>
                    <tr>
                        <td class="item">Admin Password</td>
                        <td class="result">***</td>
                    </tr>
                    </tbody>
                </table>

                <h3>Database Configuration</h3>
                <hr>
                <table>
                    <tbody>
                    <tr>
                        <td class="item">Database</td>
                        <td class="result"><?php echo $_SESSION['database'];?></td>
                    </tr>
                    <tr>
                        <td class="item">Host Name</td>
                        <td class="result"><?php echo $_SESSION['host_name'];?></td>
                    </tr>
                    <tr>
                        <td class="item">Username</td>
                        <td class="result"><span><?php echo $_SESSION['username'];?></span></td>
                    </tr>
                    <tr>
                        <td class="item">Password</td>
                        <td class="result">***</td>
                    </tr>
                    <tr>
                        <td class="item">Database Name</td>
                        <td class="result"><?php echo $_SESSION['db_name'];?></td>
                    </tr>
                    <tr>
                        <td class="item">Port</td>
                        <td class="result"><?php echo $_SESSION['port'];?></td>
                    </tr>
                    </tbody>
                </table>

                <h3>Pre-Installation Check</h3>
                <hr>
                <table>
                    <tbody>
                    <tr>
                        <td class="item">PHP Version >= 5.5.0</td>
                        <td class="result"><span class="label label-success">Yes</span></td>
                    </tr>
                    <tr>
                        <td class="item">Database Support</td>
                        <td class="result"><span class="label label-success">Yes</span></td>
                    </tr>
                    <tr>
                        <td class="item">GD Support</td>
                        <td class="result"><span class="label label-success">Yes</span></td>
                    </tr>
                    <tr>
                        <td class="item">Composer Dependencies Installed (../api/composer.json)</td>
                        <td class="result"><?php if(file_exists('../api/vendor/autoload.php')) {echo('<span class="label label-success">Yes</span>');} else {echo('<span class="label label-important">No</span><a href="https://github.com/RNGR/Directus/wiki/6.-Development-Build#step-4-install-dependencies" target="_blank"> ?</a>');} ?></td>
                    </tr>
                    <tr>
                        <td class="item">Logs Writable (../api/logs/)</td>
                        <td class="result"><?php if(is_writable('../api/logs')) {echo('<span class="label label-success">Yes</span>');}else{echo('<span class="label label-important">No</span>');}?></td>
                    </tr>
                    <tr>
                        <td class="item">mod_rewrite Enabled</td>
                        <td class="result"><?php if(function_exists('apache_get_modules') && in_array('mod_rewrite', apache_get_modules())) {echo('<span class="label label-success">Yes</span>');}else{echo('<span class="label label-important">No</span><a href="https://github.com/RNGR/directus6/wiki/Installation-Guides#how-to-enable-mod_rewrite" target="_blank"> ?</a>');}?></td>
                    </tr>
                    <tr>
                        <td class="item">Config Writable (../api/config.php)</td>
                        <td class="result"><?php if(is_writable('../api')) {$showConfig = false; echo('<span class="label label-success">Yes</span>');}else{$showConfig = true; echo('<span class="label label-important">No</span>');}?></td>
                    </tr>
                    <tr>
                        <td class="item">Migration Config</td>
                        <td class="result"><?php if(file_exists('../api/ruckusing.conf.php') && filesize('../api/ruckusing.conf.php') > 0) {echo('<span class="label label-success">Yes</span>');} else {echo('<span class="label label-important">No</span>');} ?></td>
                    </tr>
                    <tr>
                        <td class="item">Media Directory (/media)</td>
                        <td class="result"><?php if(is_writable('../media')) { echo '<span class="label label-success">Yes</span>';} else { echo '<span class="label label-important">No</span>';}?></td>
                    </tr>
                    <?php if(!is_writable('../media')): ?>
                        <tr>
                            <td>The default upload directories are either missing or don't have write permission. You can add these directories/permissions on your server or update the directus_storage_adapters table with new paths.</td>
                        </tr>
                    <?php endif; ?>
                    </tbody>
                </table>

                <?php
                if($showConfig) {
                    require_once('config_setup.php');
                    // Covering up a logic bug as config_setup.php doesn't impact $showConfig;
                    if(!isset($configText))$configText="";
                    echo("<span class='config-paste label label-important'>Manually copy the code below into ../api/config.php</span><br><textarea readonly>$configText</textarea><span id='failSpan'><button id='retryButton' class='button'>Check Config File</button></span>");
                }
                ?>

                <h3>Reccommended Optional Features</h3>
                <hr>
                <table>
                    <tbody>
                    <tr>
                        <td class="item">Imagick PHP Extension<br>For TIFF, PSD, and PDF thumbnails</td>
                        <td class="result"><?php if(extension_loaded('imagick')) {echo('<span class="label label-success">Yes</span>');} else {echo('<span class="label label-important">No</span>');}?></td>
                    </tr>
                    </tbody>
                </table>

                <h3>Email This Summary?</h3>
                <hr>
                <table>
                    <tbody>
                    <tr>
                        <td class="item"><?php echo $_SESSION['email'];?></td>
                        <td class="result"><input type="checkbox" value="yes" name="send_config_email" checked></td>
                    </tr>
                    </tbody>
                </table>
            </div>
            <?php
        }

        if($step == 4) {
            require_once('query.php');
            $setupResponse = $main->execute(array('', 'db:setup'));
            $migrateResponse = $main->execute(array('', 'db:migrate'));
            AddSettings($mysqli);
            AddDefaultUser($_SESSION['email'], $_SESSION['password'], $mysqli);
            AddStorageAdapters($mysqli);
            if(isset($_SESSION['initial_schema']) && $_SESSION['initial_schema'] == "ui_gallery") {
                InstallSampleData($mysqli);
            }
            if(isset($_SESSION['send_config_email']) && $_SESSION['send_config_email'] == "yes") {
                require_once('config_setup.php');
                $mailBody = '<html>
                    <p style="color:#333333;font-size:12px;font-family: "HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif;font-weight: 300;">
                    <table style="margin-bottom:20px;" width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                    <td align="center">
                    <img src="data:image/gif;base64,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">
                    </td>
                    </tr>
                    </table>
                    <h3>Main Configuration</h3>
                    <hr style="border:0;height:0;border-top:1px solid rgba(0, 0, 0, 0.1);border-bottom:1px solid rgba(255, 255, 255, 0.3);">
                    <table style="margin-bottom:20px;">
                    <tbody>
                    <tr>
                    <td style="width: 140px;">Project Name</td>
                    <td>'.$_SESSION['site_name'].'</td>
                    </tr>
                    <tr>
                    <td style="width: 140px;">Admin Email</td>
                    <td>'.$_SESSION['email'].'</td>
                    </tr>
                    <tr>
                    <td style="width: 140px;">Admin Password</td>
                    <td>***</td>
                    </tr>
                    </tbody>
                    </table>
                    <h3>Database Configuration</h3>
                    <hr style="border:0;height:0;border-top:1px solid rgba(0, 0, 0, 0.1);border-bottom:1px solid rgba(255, 255, 255, 0.3);">
                    <table style="margin-bottom:20px;">
                    <tbody>
                    <tr>
                    <td style="width: 140px;">Database</td>
                    <td>'.$_SESSION['database'].'</td>
                    </tr>
                    <tr>
                    <td style="width: 140px;">Host Name</td>
                    <td>'.$_SESSION['host_name'].'</td>
                    </tr>
                    <tr>
                    <td style="width: 140px;">Username</td>
                    <td>'.$_SESSION['username'].'</td>
                    </tr>
                    <tr>
                    <td style="width: 140px;">Password</td>
                    <td>***</td>
                    </tr>
                    <tr>
                    <td style="width: 140px;">Database Name</td>
                    <td>'.$_SESSION['db_name'].'</td>
                    </tr>
                    <tr>
                    <td style="width: 140px;">Port</td>
                    <td>'.$_SESSION['port'].'</td>
                    </tr>
                    </tbody>
                    </table>
                    <h3>Config File</h3><textarea style="min-width: 300px;min-height: 100px;">'.$configText.'</textarea></p></html>';
                $headers  = 'MIME-Version: 1.0' . "\r\n";
                $headers .= 'Content-type: text/html; charset=iso-8859-1' . "\r\n";
                mail($_SESSION['email'], "Directus Install Config Overview", $mailBody, $headers);
            }
            $mysqli->close();

            require_once('config_setup.php');
            WriteConfig(array(
                'db_host' => $_SESSION['host_name'],
                'db_name' => $_SESSION['db_name'],
                'db_user' => $_SESSION['username'],
                'db_pass' => $_SESSION['db_password'],
                'db_prefix' => '',//$_SESSION['db_prefix'],
                'directus_path' => $_SESSION['directus_path'],
            ));

            // @TODO: put all this data into an array.
            // so we can clear all session unset($_SESSION['installation']);
            $install_data = array(
                'step',
                'email',
                'site_name',
                'password',
                'directus_path',
                'host_name',
                'username',
                'db_password',
                'db_name',
                'db_prefix',
                'initial_schema',
                'default_dest',
                'default_url',
                'thumb_dest',
                'thumb_url',
                'temp_dest',
                'temp_url',
                'send_config_email'
            );

            foreach($_SESSION as $key => $value) {
                if (in_array($key, $install_data)) {
                    unset($_SESSION[$key]);
                }
            }

            header('Location: ../');
        }
        ?>
        <script>var step = <?php echo($step); ?>;</script>
        <button type="submit" class="button primary disabled">Continue</button>
        <button name="backButton" class="no-button<?PHP if($step == 1){echo " hide";}?>">Go Back</button>
    </div>
</form>
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js"></script>
<script type="text/javascript" src="install.js"></script>
</body>
</html>
<?php ob_end_flush(); ?>
