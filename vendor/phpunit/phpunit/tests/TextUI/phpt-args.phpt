--TEST--
PHPT runner supports ARGS section
--ARGS--
help
--FILE--
<?php
if ($argc > 0 && $argv[1] == 'help') {
    echo 'Help';
}
?>
--EXPECT--
Help
