<?php

use Twig\Node\Expression\Binary\EqualBinary;

class_exists('Twig\Node\Expression\Binary\EqualBinary');

@trigger_error(sprintf('Using the "Twig_Node_Expression_Binary_Equal" class is deprecated since Twig version 2.7, use "Twig\Node\Expression\Binary\EqualBinary" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\Expression\Binary\EqualBinary" instead */
    class Twig_Node_Expression_Binary_Equal extends EqualBinary
    {
    }
}
