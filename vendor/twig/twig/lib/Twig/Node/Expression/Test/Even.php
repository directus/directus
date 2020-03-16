<?php

use Twig\Node\Expression\Test\EvenTest;

class_exists('Twig\Node\Expression\Test\EvenTest');

@trigger_error(sprintf('Using the "Twig_Node_Expression_Test_Even" class is deprecated since Twig version 2.7, use "Twig\Node\Expression\Test\EvenTest" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\Expression\Test\EvenTest" instead */
    class Twig_Node_Expression_Test_Even extends EvenTest
    {
    }
}
