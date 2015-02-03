<?php
/**
 * Slim - a micro PHP 5 framework
 *
 * @author      Josh Lockhart <info@slimframework.com>
 * @copyright   2011 Josh Lockhart
 * @link        http://www.slimframework.com
 * @license     http://www.slimframework.com/license
 * @version     2.2.0
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

class ViewTest extends PHPUnit_Framework_TestCase
{
    public function setUp()
    {
        $this->view = new \Slim\View();
    }

    public function generateTestData()
    {
        return array('a' => 1, 'b' => 2, 'c' => 3);
    }

    /**
     * Test initial View data is an empty array
     *
     * Pre-conditions:
     * None
     *
     * Post-conditions:
     * The View object's data attribute is an empty array
     */
    public function testViewIsConstructedWithDataArray()
    {
        $this->assertEquals(array(), $this->view->getData());
    }

    /**
     * Test View sets and gets data
     *
     * Pre-conditions:
     * Case A: Set view data key/value
     * Case B: Set view data as array
     * Case C: Set view data with one argument that is not an array
     *
     * Post-conditions:
     * Case A: Data key/value are set
     * Case B: Data is set to array
     * Case C: An InvalidArgumentException is thrown
     */
    public function testViewSetAndGetData()
    {
        //Case A
        $this->view->setData('one', 1);
        $this->assertEquals(1, $this->view->getData('one'));

        //Case B
        $data = array('foo' => 'bar', 'a' => 'A');
        $this->view->setData($data);
        $this->assertSame($data, $this->view->getData());

        //Case C
        try {
            $this->view->setData('foo');
            $this->fail('Setting View data with non-array single argument did not throw exception');
        } catch ( \InvalidArgumentException $e ) {}
    }

    /**
     * Test View appends data
     *
     * Pre-conditions:
     * Case A: Append data to View several times
     * Case B: Append view data which is not an array
     *
     * Post-conditions:
     * Case A: The View data contains all appended data
     * Case B: An InvalidArgumentException is thrown
     */
    public function testViewAppendsData()
    {
        //Case A
        $this->view->appendData(array('a' => 'A'));
        $this->view->appendData(array('b' => 'B'));
        $this->assertEquals(array('a' => 'A', 'b' => 'B'), $this->view->getData());

        //Case B
        try {
            $this->view->appendData('not an array');
            $this->fail('Appending View data with non-array argument did not throw exception');
        } catch ( \InvalidArgumentException $e ) {}

    }

    /**
     * Test View templates directory
     *
     * Pre-conditions:
     * View templates directory is set to an existing directory
     *
     * Post-conditions:
     * The templates directory is set correctly.
     */
    public function testSetsTemplatesDirectory()
    {
        $templatesDirectory = dirname(__FILE__) . '/templates';
        $this->view->setTemplatesDirectory($templatesDirectory);
        $this->assertEquals($templatesDirectory, $this->view->getTemplatesDirectory());
    }

    /**
     * Test View templates directory may have a trailing slash when set
     *
     * Pre-conditions:
     * View templates directory is set to an existing directory with a trailing slash
     *
     * Post-conditions:
     * The View templates directory is set correctly without a trailing slash
     */
    public function testTemplatesDirectoryWithTrailingSlash()
    {
        $this->view->setTemplatesDirectory(dirname(__FILE__) . '/templates/');
        $this->assertEquals(dirname(__FILE__) . '/templates', $this->view->getTemplatesDirectory());
    }

    /**
     * Test View renders template
     *
     * Pre-conditions:
     * View templates directory is set to an existing directory.
     * View data is set without errors
     * Case A: View renders an existing template
     * Case B: View renders a non-existing template
     *
     * Post-conditions:
     * Case A: The rendered template is returned as a string
     * Case B: A RuntimeException is thrown
     */
    public function testRendersTemplateWithData()
    {
        $this->view->setTemplatesDirectory(dirname(__FILE__) . '/templates');
        $this->view->setData(array('foo' => 'bar'));

        //Case A
        $output = $this->view->render('test.php');
        $this->assertEquals('test output bar', $output);

        //Case B
        try {
            $output = $this->view->render('foo.php');
            $this->fail('Rendering non-existent template did not throw exception');
        } catch ( \RuntimeException $e ) {}
    }

    /**
     * Test View displays template
     *
     * Pre-conditions:
     * View templates directory is set to an existing directory.
     * View data is set without errors
     * View is displayed
     *
     * Post-conditions:
     * The output buffer contains the rendered template
     */
    public function testDisplaysTemplateWithData()
    {
        $this->expectOutputString('test output bar');
        $this->view->setTemplatesDirectory(dirname(__FILE__) . '/templates');
        $this->view->setData(array('foo' => 'bar'));
        $this->view->display('test.php');
    }

}
