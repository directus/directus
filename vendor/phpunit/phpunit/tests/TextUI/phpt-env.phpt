--TEST--
PHPT runner should support ENV section
--ENV--
FOO=bar
--FILE--
<?php
if (isset($_SERVER['FOO'])) {
    var_dump($_SERVER['FOO']);
}
?>
--EXPECTF_EXTERNAL--
_files/phpt-env.expected.txt
