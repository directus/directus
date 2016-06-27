<?php $code = 0; ?>
<div class="container">
    <?php include __DIR__.'/partials/errors.php'; ?>
    <label for="db_type"><?=__t('Database Type');?></label>
    <div class="select-container">
        <select name="db_type" id="db_type">
            <?php foreach($step->getSafeData('db_types') as $dbType): ?>
            <option value="<?=$dbType['id'];?>" <?php echo($step->getSafeData('db_type') && $step->getSafeData('db_type') == $dbType['id'] ? 'selected' : ''); ?>><?=$dbType['name'];?></option>
            <?php endforeach; ?>
        </select>
        <i class="material-icons select-arrow">arrow_drop_down</i>
    </div>
    <div>
        <div class="input-left">
            <label for="db_host"><?=__t('Host');?></label><input type="text" id="db_host" placeholder="eg: localhost" class="<?php if($code == 2002){echo "error";}?>" name="db_host" value="<?php echo($step->getSafeData('db_host') ? $step->getSafeData('db_host') : 'localhost'); ?>" autofocus><br>
        </div>
        <div class="input-right">
            <label for="db_port"><?=__t('Port');?></label><input type="number" id="db_port" placeholder="3306" min="0" max="99999" class="<?php if($code == 2002){echo "error";}?>" name="db_port" value="<?php echo($step->getSafeData('db_port') ? $step->getSafeData('db_port') : '3306'); ?>"><br>
        </div>
    </div>
    <label for="db_user"><?=__t('User');?></label><input type="text" id="db_user" placeholder="With access/modify privileges" class="<?php if($code == 1045){echo "error";}?>" name="db_user" value="<?php echo($step->getSafeData('db_user') ? $step->getSafeData('db_user') : ''); ?>"><br>
    <label for="db_password"><?=__t('Password');?></label><input type="password" id="db_password" placeholder="" class="<?php if($code == 1045){echo "error";}?>" name="db_password" value="<?php echo($step->getSafeData('db_password') ? $step->getSafeData('db_password') : ''); ?>"><br>
    <label for="db_name"><?=__t('Database Name');?></label><input type="text" id="db_name" placeholder="" class="<?php if($code == 1049){echo "error";}?>" name="db_name" value="<?php echo($step->getSafeData('db_name') ? $step->getSafeData('db_name') : ''); ?>"><br>
    <label for="db_schema"><?=__t('Initial Schema');?></label>
    <div class="select-container">
        <select name="db_schema" id="db_schema">
            <option value=""><?=__t('None (Clean Database)');?></option>
            <?php foreach($step->getSafeData('db_schemas') as $dbSchemas): ?>
            <option value="<?=$dbSchemas['id'];?>" <?php echo($step->getSafeData('db_schema') && $step->getSafeData('db_schema') == $dbSchemas['id'] ? 'selected' : ''); ?>><?=$dbSchemas['name'];?></option>
            <?php endforeach; ?>
        </select>
        <i class="material-icons select-arrow">arrow_drop_down</i>
    </div>
</div>
