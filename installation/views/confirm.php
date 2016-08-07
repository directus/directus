<div class="container step-3">
    <?php include __DIR__.'/partials/warnings.php'; ?>
    <?php include __DIR__.'/partials/errors.php'; ?>
    <h3>Project Configuration</h3>
    <hr>
    <table>
        <tbody>
        <tr>
            <td class="item"><?=__t('Project Name');?></td>
            <td class="result"><?php echo $data->getSafe('directus_name');?></td>
        </tr>
        <tr>
            <td class="item"><?=__t('Admin Email');?></td>
            <td class="result"><span><?php echo $data->getSafe('directus_email');?></span>
            </td>
        </tr>
        <tr>
            <td class="item"><?=__t('Admin Password');?></td>
            <td class="result">***</td>
        </tr>
        </tbody>
    </table>

    <h3><?=__t('Database Configuration');?></h3>
    <hr>
    <table>
        <tbody>
        <?php if ($data->getSafe('strict_mode_enabled') === true): ?>
        <tr id="strict_mode_enabled">
            <td class="item"><?=__t('Strict Mode Disabled');?></td>
            <td class="result"><span class="label label-important"><?=__t('No');?></span><a href="http://getdirectus.com/docs/developer/installation" target="_blank"> ?</a></td>
        </tr>
        <?php endif; ?>
        <tr>
            <td class="item"><?=__t('Database');?></td>
            <td class="result"><?php echo $data->getSafe('db_type');?></td>
        </tr>
        <tr>
            <td class="item"><?=__t('Host Name');?></td>
            <td class="result"><?php echo $data->getSafe('db_host');?></td>
        </tr>
        <tr>
            <td class="item"><?=__t('Port');?></td>
            <td class="result"><?php echo $data->getSafe('db_port');?></td>
        </tr>
        <tr>
            <td class="item"><?=__t('Username');?></td>
            <td class="result"><span><?php echo $data->getSafe('db_user');?></span></td>
        </tr>
        <tr>
            <td class="item"><?=__t('Password');?></td>
            <td class="result">***</td>
        </tr>
        <tr>
            <td class="item"><?=__t('Database Name');?></td>
            <td class="result"><?php echo $data->getSafe('db_name');?></td>
        </tr>
        <tr>
            <td class="item"><?=__t('Schema');?></td>
            <td class="result"><?php echo $data->getSafe('db_schema') ? $data->getSafe('db_schema') : 'none';?></td>
        </tr>
        </tbody>
    </table>

    <h3><?=__t('Pre-Installation Check');?></h3>
    <hr>
    <table>
        <tbody>
        <tr>
            <td class="item"><?=__t('PHP Version');?> >= 5.5.0</td>
            <td class="result"><span class="label label-success"><?=__t('Yes');?></span></td>
        </tr>
        <tr>
            <td class="item"><?=__t('Database Support');?></td>
            <td class="result"><span class="label label-success"><?=__t('Yes');?></span></td>
        </tr>
        <tr>
            <td class="item"><?=__t('GD Support');?></td>
            <td class="result"><span class="label label-success"><?=__t('Yes');?></span></td>
        </tr>
        <tr>
            <td class="item"><?=__t('Composer Dependencies Installed');?> (../api/composer.json)</td>
            <td class="result"><?php if(file_exists('../vendor/autoload.php')) {echo('<span class="label label-success">'.__t('Yes').'</span>');} else {echo('<span class="label label-important">'.__t('No.').'</span><a href="http://getdirectus.com/docs/developer/installation" target="_blank"> ?</a>');} ?></td>
        </tr>
        <tr>
            <td class="item"><?=__t('Logs Writable');?> (../api/logs/)</td>
            <td class="result"><?php if(is_writable('../api/logs')) {echo('<span class="label label-success">'.__t('Yes').'</span>');}else{echo('<span class="label label-important">'.__t('No').'</span>');}?></td>
        </tr>
        <tr>
            <td class="item"><?=__t('mod_rewrite Enabled');?></td>
            <td class="result"><?php if (ping_server()) {echo('<span class="label label-success">'.__t('Yes').'</span>');}else{echo('<span class="label label-important">'.__t('No').'</span><a href="http://getdirectus.com/docs/developer/faq" target="_blank"> ?</a>');}?></td>
        </tr>
        <tr>
            <td class="item"><?=__t('Config Writable');?> (../api/config.php)</td>
            <td class="result"><?php if(is_writable('../api')) {$showConfig = false; echo('<span class="label label-success">'.__t('Yes').'</span>');}else{$showConfig = true; echo('<span class="label label-important">'.__t('No').'</span>');}?></td>
        </tr>
        <tr>
            <td class="item"><?=__t('Migration Config');?></td>
            <td class="result"><?php if(file_exists('../api/ruckusing.conf.php') && filesize('../api/ruckusing.conf.php') > 0) {echo('<span class="label label-success">'.__t('Yes').'</span>');} else {echo('<span class="label label-important">'.__t('No').'</span>');} ?></td>
        </tr>
        <tr>
            <td class="item"><?=__t('Media Directory');?> (/media)</td>
            <td class="result"><?php if(is_writable('../storage/uploads')) { echo '<span class="label label-success">'.__t('Yes').'</span>';} else { echo '<span class="label label-important">'.__t('No').'</span>';}?></td>
        </tr>
        <?php if(!is_writable('../storage/uploads')): ?>
            <tr>
                <td><?=__t("The default upload directories are either missing or don't have write permission. You can add these directories/permissions on your server or update the directus_storage_adapters table with new paths.");?></td>
            </tr>
        <?php endif; ?>
        </tbody>
    </table>

    <?php
    if($showConfig) {
        require_once('config_setup.php');
        // Covering up a logic bug as config_setup.php doesn't impact $showConfig;
        if(!isset($configText))$configText="";
        echo("<span class='config-paste label label-important'>".__t('Manually copy the code below into')." ../api/config.php</span><br><textarea readonly>$configText</textarea><span id='failSpan'><button id='retryButton' class='button'>".__t('Check Config File')."</button></span>");
    }
    ?>

    <h3><?=__t('Reccommended Optional Features');?></h3>
    <hr>
    <table>
        <tbody>
        <tr>
            <td class="item"><?=__t('Imagick PHP Extension');?><br><?=__t('For TIFF, PSD, and PDF thumbnails');?></td>
            <td class="result"><?php if(extension_loaded('imagick')) {echo('<span class="label label-success">'.__t('Yes').'</span>');} else {echo('<span class="label label-important">'.__t('No').'</span>');}?></td>
        </tr>
        </tbody>
    </table>

    <h3><?=__t('Email This Summary?');?></h3>
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
