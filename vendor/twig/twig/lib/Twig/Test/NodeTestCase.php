<?php

use Twig\Test\NodeTestCase;

class_exists('Twig\Test\NodeTestCase');

@trigger_error(sprintf('Using the "Twig_Test_NodeTestCase" class is deprecated since Twig version 2.7, use "Twig\Test\NodeTestCase" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Test\NodeTestCase" instead */
    class Twig_Test_NodeTestCase extends NodeTestCase
    {
    }
}
