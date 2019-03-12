<?php

use Twig\Node\Expression\Test\NullTest;

class_exists('Twig\Node\Expression\Test\NullTest');

@trigger_error(sprintf('Using the "Twig_Node_Expression_Test_Null" class is deprecated since Twig version 2.7, use "Twig\Node\Expression\Test\NullTest" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\Expression\Test\NullTest" instead */
    class Twig_Node_Expression_Test_Null extends NullTest
    {
    }
}
