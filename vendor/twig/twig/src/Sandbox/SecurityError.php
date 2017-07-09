<?php

namespace Twig\Sandbox;

class_exists('Twig_Sandbox_SecurityError');

if (\false) {
    class SecurityError extends \Twig_Sandbox_SecurityError
    {
    }
}
