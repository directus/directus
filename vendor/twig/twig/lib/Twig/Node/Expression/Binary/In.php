<?php

use Twig\Node\Expression\Binary\InBinary;

class_exists('Twig\Node\Expression\Binary\InBinary');

@trigger_error(sprintf('Using the "Twig_Node_Expression_Binary_In" class is deprecated since Twig version 2.7, use "Twig\Node\Expression\Binary\InBinary" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\Expression\Binary\InBinary" instead */
    class Twig_Node_Expression_Binary_In extends InBinary
    {
    }
}
