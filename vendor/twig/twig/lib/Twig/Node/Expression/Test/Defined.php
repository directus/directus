<?php

use Twig\Node\Expression\Test\DefinedTest;

class_exists('Twig\Node\Expression\Test\DefinedTest');

@trigger_error(sprintf('Using the "Twig_Node_Expression_Test_Defined" class is deprecated since Twig version 2.7, use "Twig\Node\Expression\Test\DefinedTest" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\Expression\Test\DefinedTest" instead */
    class Twig_Node_Expression_Test_Defined extends DefinedTest
    {
    }
}
