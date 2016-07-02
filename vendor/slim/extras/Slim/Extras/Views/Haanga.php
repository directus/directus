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
 * HaangaView
 *
 * The HaangaView is a custom View class that renders templates using the Haanga
 * template language (http://haanga.org/).
 *
 * Currently, to use HaangaView, developer must instantiate this class and pass these params:
 * - path to Haanga directory which contain `lib`
 * - path to templates directory
 * - path to compiled templates directory
 *
 * Example:
 * {{{
 *      require_once 'views/HaangaView.php';
 *      Slim::init(array(
 *          'view' => new HaangaView('/path/to/Haanga/dir', '/path/to/templates/dir', '/path/to/compiled/dir')
 *      ));
 * }}}
 *
 * @package Slim
 * @author  Isman Firmansyah
 */
class Haanga extends \Slim\View
{
    /**
     * Configure Haanga environment
     */
    public function __construct($haangaDir, $templatesDir, $compiledDir)
    {
        require_once $haangaDir . '/lib/Haanga.php';
        \Haanga::configure(array(
            'template_dir' => $templatesDir,
            'cache_dir' => $compiledDir
        ));
    }

    /**
     * Render Haanga Template
     *
     * This method will output the rendered template content
     *
     * @param   string $template The path to the Haanga template, relative to the Haanga templates directory.
     * @return  string|NULL
     */
    public function render($template)
    {
        return \Haanga::load($template, $this->data);
    }
}
