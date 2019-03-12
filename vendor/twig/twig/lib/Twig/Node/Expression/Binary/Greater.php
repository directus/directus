<?php

use Twig\Node\Expression\Binary\GreaterBinary;

class_exists('Twig\Node\Expression\Binary\GreaterBinary');

@trigger_error(sprintf('Using the "Twig_Node_Expression_Binary_Greater" class is deprecated since Twig version 2.7, use "Twig\Node\Expression\Binary\GreaterBinary" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\Expression\Binary\GreaterBinary" instead */
    class Twig_Node_Expression_Binary_Greater extends GreaterBinary
    {
    }
}
