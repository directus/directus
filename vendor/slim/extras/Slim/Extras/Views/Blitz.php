<?php
/**
 * Slim - a micro PHP 5 framework
 *
 * @author      Josh Lockhart
 * @link        http://www.slimframework.com
 * @copyright   2011 Josh Lockhart
 *
 * MIT LICENSE
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
namespace Slim\Extras\Views;

/**
 * BlitzView
 *
 * The BlitzView provides native support for the Blitz templating system
 * for PHP. Blitz is written as C and compiled to a PHP extension. Which means
 * it is FAST. You can learn more about Blitz at:
 *
 * <http://alexeyrybak.com/blitz/blitz_en.html>
 *
 * The xBlitz extended blitz class provides better block handling
 * (load assoc arrays correctly, one level)
 *
 * @author Tobias O. <https://github.com/tobsn>
 */
class xBlitz extends \Blitz
{
    function xblock($k,$a)
    {
        foreach ($a as $v) {
            $this->block('/' . $k, $v, true);
        }
    }
}

class Blitz extends \Slim\View
{
    private $blitzEnvironment = null;

    public function render($template)
    {
        $env = $this->getEnvironment($template);

        return $env->parse($this->getData());
    }

    private function getEnvironment($template)
    {
        if (!$this->blitzEnvironment) {
            ini_set('blitz.path', $this->getTemplatesDirectory() . '/');
            $this->blitzEnvironment = new xBlitz($template);
        }

        return $this->blitzEnvironment;
    }
}
