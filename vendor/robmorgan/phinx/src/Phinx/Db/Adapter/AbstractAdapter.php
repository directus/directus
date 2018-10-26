<?php
/**
 * Phinx
 *
 * (The MIT license)
 * Copyright (c) 2017 Cake Software Foundation
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated * documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 *
 * @package    Phinx
 * @subpackage Phinx\Db\Adapter
 */
namespace Phinx\Db\Adapter;

use Phinx\Db\Table;
use Phinx\Db\Table\Column;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\NullOutput;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * Base Abstract Database Adapter.
 */
abstract class AbstractAdapter implements AdapterInterface
{
    /**
     * @var array
     */
    protected $options = [];

    /**
     * @var \Symfony\Component\Console\Input\InputInterface
     */
    protected $input;

    /**
     * @var \Symfony\Component\Console\Output\OutputInterface
     */
    protected $output;

    /**
     * @var string
     */
    protected $schemaTableName = 'phinxlog';

    /**
     * Class Constructor.
     *
     * @param array $options Options
     * @param \Symfony\Component\Console\Input\InputInterface $input Input Interface
     * @param \Symfony\Component\Console\Output\OutputInterface  $output Output Interface
     */
    public function __construct(array $options, InputInterface $input = null, OutputInterface $output = null)
    {
        $this->setOptions($options);
        if ($input !== null) {
            $this->setInput($input);
        }
        if ($output !== null) {
            $this->setOutput($output);
        }
    }

    /**
     * {@inheritdoc}
     */
    public function setOptions(array $options)
    {
        $this->options = $options;

        if (isset($options['default_migration_table'])) {
            $this->setSchemaTableName($options['default_migration_table']);
        }

        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function getOptions()
    {
        return $this->options;
    }

    /**
     * {@inheritdoc}
     */
    public function hasOption($name)
    {
        return isset($this->options[$name]);
    }

    /**
     * {@inheritdoc}
     */
    public function getOption($name)
    {
        if (!$this->hasOption($name)) {
            return null;
        }

        return $this->options[$name];
    }

    /**
     * {@inheritdoc}
     */
    public function setInput(InputInterface $input)
    {
        $this->input = $input;

        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function getInput()
    {
        return $this->input;
    }

    /**
     * {@inheritdoc}
     */
    public function setOutput(OutputInterface $output)
    {
        $this->output = $output;

        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function getOutput()
    {
        if ($this->output === null) {
            $output = new NullOutput();
            $this->setOutput($output);
        }

        return $this->output;
    }

    /**
     * {@inheritdoc}
     *
     * @return array
     */
    public function getVersions()
    {
        $rows = $this->getVersionLog();

        return array_keys($rows);
    }

    /**
     * Gets the schema table name.
     *
     * @return string
     */
    public function getSchemaTableName()
    {
        return $this->schemaTableName;
    }

    /**
     * Sets the schema table name.
     *
     * @param string $schemaTableName Schema Table Name
     * @return $this
     */
    public function setSchemaTableName($schemaTableName)
    {
        $this->schemaTableName = $schemaTableName;

        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function hasSchemaTable()
    {
        return $this->hasTable($this->getSchemaTableName());
    }

    /**
     * {@inheritdoc}
     */
    public function createSchemaTable()
    {
        try {
            $options = [
                'id' => false,
                'primary_key' => 'version'
            ];

            $table = new Table($this->getSchemaTableName(), $options, $this);
            $table->addColumn('version', 'biginteger')
                ->addColumn('migration_name', 'string', ['limit' => 100, 'default' => null, 'null' => true])
                ->addColumn('start_time', 'timestamp', ['default' => null, 'null' => true])
                ->addColumn('end_time', 'timestamp', ['default' => null, 'null' => true])
                ->addColumn('breakpoint', 'boolean', ['default' => false])
                ->save();
        } catch (\Exception $exception) {
            throw new \InvalidArgumentException('There was a problem creating the schema table: ' . $exception->getMessage());
        }
    }

    /**
     * {@inheritdoc}
     */
    public function getAdapterType()
    {
        return $this->getOption('adapter');
    }

    /**
     * {@inheritdoc}
     */
    public function isValidColumnType(Column $column)
    {
        return in_array($column->getType(), $this->getColumnTypes());
    }

    /**
     * Determines if instead of executing queries a dump to standard output is needed
     *
     * @return bool
     */
    public function isDryRunEnabled()
    {
        $input = $this->getInput();

        return ($input && $input->hasOption('dry-run')) ? $input->getOption('dry-run') : false;
    }
}
