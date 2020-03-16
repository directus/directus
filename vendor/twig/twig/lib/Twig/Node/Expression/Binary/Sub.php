<?php

use Twig\Node\Expression\Binary\SubBinary;

class_exists('Twig\Node\Expression\Binary\SubBinary');

@trigger_error(sprintf('Using the "Twig_Node_Expression_Binary_Sub" class is deprecated since Twig version 2.7, use "Twig\Node\Expression\Binary\SubBinary" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\Expression\Binary\SubBinary" instead */
    class Twig_Node_Expression_Binary_Sub extends SubBinary
    {
    }
}
