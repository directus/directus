<?php
/**
 * Phinx
 *
 * (The MIT license)
 * Copyright (c) 2015 Rob Morgan
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
 * @subpackage Phinx\Migration
 */
namespace Phinx\Db\Adapter;

/**
 * Adapter factory and registry.
 *
 * Used for registering adapters and creating instances of adapters.
 *
 * @author Woody Gilk <woody.gilk@gmail.com>
 */
class AdapterFactory
{
    /**
     * @var \Phinx\Db\Adapter\AdapterFactory
     */
    protected static $instance;

    /**
     * Get the factory singleton instance.
     *
     * @return \Phinx\Db\Adapter\AdapterFactory
     */
    public static function instance()
    {
        if (!static::$instance) {
            static::$instance = new static();
        }

        return static::$instance;
    }

    /**
     * Class map of database adapters, indexed by PDO::ATTR_DRIVER_NAME.
     *
     * @var array
     */
    protected $adapters = [
        'mysql' => 'Phinx\Db\Adapter\MysqlAdapter',
        'pgsql' => 'Phinx\Db\Adapter\PostgresAdapter',
        'sqlite' => 'Phinx\Db\Adapter\SQLiteAdapter',
        'sqlsrv' => 'Phinx\Db\Adapter\SqlServerAdapter',
    ];

    /**
     * Class map of adapters wrappers, indexed by name.
     *
     * @var array
     */
    protected $wrappers = [
        'prefix' => 'Phinx\Db\Adapter\TablePrefixAdapter',
        'proxy' => 'Phinx\Db\Adapter\ProxyAdapter',
        'timed' => 'Phinx\Db\Adapter\TimedOutputAdapter',
    ];

    /**
     * Add or replace an adapter with a fully qualified class name.
     *
     * @throws \RuntimeException
     * @param  string $name
     * @param  string $class
     * @return $this
     */
    public function registerAdapter($name, $class)
    {
        if (!is_subclass_of($class, 'Phinx\Db\Adapter\AdapterInterface')) {
            throw new \RuntimeException(sprintf(
                'Adapter class "%s" must implement Phinx\\Db\\Adapter\\AdapterInterface',
                $class
            ));
        }
        $this->adapters[$name] = $class;

        return $this;
    }

    /**
     * Get an adapter class by name.
     *
     * @throws \RuntimeException
     * @param  string $name
     * @return string
     */
    protected function getClass($name)
    {
        if (empty($this->adapters[$name])) {
            throw new \RuntimeException(sprintf(
                'Adapter "%s" has not been registered',
                $name
            ));
        }

        return $this->adapters[$name];
    }

    /**
     * Get an adapter instance by name.
     *
     * @param  string $name
     * @param  array  $options
     * @return \Phinx\Db\Adapter\AdapterInterface
     */
    public function getAdapter($name, array $options)
    {
        $class = $this->getClass($name);

        return new $class($options);
    }

    /**
     * Add or replace a wrapper with a fully qualified class name.
     *
     * @throws \RuntimeException
     * @param  string $name
     * @param  string $class
     * @return $this
     */
    public function registerWrapper($name, $class)
    {
        if (!is_subclass_of($class, 'Phinx\Db\Adapter\WrapperInterface')) {
            throw new \RuntimeException(sprintf(
                'Wrapper class "%s" must be implement Phinx\\Db\\Adapter\\WrapperInterface',
                $class
            ));
        }
        $this->wrappers[$name] = $class;

        return $this;
    }

    /**
     * Get a wrapper class by name.
     *
     * @throws \RuntimeException
     * @param  string $name
     * @return string
     */
    protected function getWrapperClass($name)
    {
        if (empty($this->wrappers[$name])) {
            throw new \RuntimeException(sprintf(
                'Wrapper "%s" has not been registered',
                $name
            ));
        }

        return $this->wrappers[$name];
    }

    /**
     * Get a wrapper instance by name.
     *
     * @param  string $name
     * @param  \Phinx\Db\Adapter\AdapterInterface $adapter
     * @return \Phinx\Db\Adapter\AdapterInterface
     */
    public function getWrapper($name, AdapterInterface $adapter)
    {
        $class = $this->getWrapperClass($name);

        return new $class($adapter);
    }
}
