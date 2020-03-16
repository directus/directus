<?php

use Twig\Node\Expression\Binary\AddBinary;

class_exists('Twig\Node\Expression\Binary\AddBinary');

@trigger_error(sprintf('Using the "Twig_Node_Expression_Binary_Add" class is deprecated since Twig version 2.7, use "Twig\Node\Expression\Binary\AddBinary" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\Expression\Binary\AddBinary" instead */
    class Twig_Node_Expression_Binary_Add extends AddBinary
    {
    }
}
