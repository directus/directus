<?php
function foo($a, array $b, array $c = array()) {}
interface i { public function m($a, array $b, array $c = array()); }
abstract class a { abstract public function m($a, array $b, array $c = array()); }
class c { public function m($a, array $b, array $c = array()) {} }
