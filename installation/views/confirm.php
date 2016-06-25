<div class="container step-3">
    <?php include __DIR__.'/partials/warnings.php'; ?>
    <?php include __DIR__.'/partials/errors.php'; ?>
    <h3>Project Configuration</h3>
    <hr>
    <table>
        <tbody>
        <tr>
            <td class="item">Project Name</td>
            <td class="result"><?php echo $data->getSafe('directus_name');?></td>
        </tr>
        <tr>
            <td class="item">Admin Email</td>
            <td class="result"><span><?php echo $data->getSafe('directus_email');?></span>
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
            <td class="result"><?php echo $data->getSafe('db_type');?></td>
        </tr>
        <tr>
            <td class="item">Host Name</td>
            <td class="result"><?php echo $data->getSafe('db_host');?></td>
        </tr>
        <tr>
            <td class="item">Port</td>
            <td class="result"><?php echo $data->getSafe('db_port');?></td>
        </tr>
        <tr>
            <td class="item">Username</td>
            <td class="result"><span><?php echo $data->getSafe('db_user');?></span></td>
        </tr>
        <tr>
            <td class="item">Password</td>
            <td class="result">***</td>
        </tr>
        <tr>
            <td class="item">Database Name</td>
            <td class="result"><?php echo $data->getSafe('db_name');?></td>
        </tr>
        <tr>
            <td class="item">Schema</td>
            <td class="result"><?php echo $data->getSafe('db_schema') ? $data->getSafe('db_schema') : 'none';?></td>
        </tr>
        </tbody>
    </table>

    <h3>Pre-Installation Check</h3>
    <hr>
    <table>
        <tbody>
        <tr>
            <td class="item">PHP Version >= 5.4.0</td>
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
            <td class="result"><?php if(file_exists('../vendor/autoload.php')) {echo('<span class="label label-success">Yes</span>');} else {echo('<span class="label label-important">No</span><a href="https://github.com/RNGR/Directus/wiki/6.-Development-Build#step-4-install-dependencies" target="_blank"> ?</a>');} ?></td>
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
            <td class="item"><?php echo $data->getSafe('directus_email');?></td>
            <td class="result"><input type="checkbox" value="yes" name="send_config_email" checked></td>
        </tr>
        </tbody>
    </table>
</div>
