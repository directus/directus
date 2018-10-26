<?php

namespace Twig\Sandbox;

class_exists('Twig_Sandbox_SecurityNotAllowedMethodError');

if (\false) {
    class SecurityNotAllowedMethodError extends \Twig_Sandbox_SecurityNotAllowedMethodError
    {
    }
}
