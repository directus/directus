<?php if ($step->getResponse()): ?>
    <?php foreach($step->getResponse()->getErrors() as $message): ?>
        <p><?=__t($message);?></p>
    <?php endforeach; ?>
<?php endif; ?>
