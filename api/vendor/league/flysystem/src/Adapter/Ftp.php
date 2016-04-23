<?php

namespace League\Flysystem\Adapter;

use ErrorException;
use League\Flysystem\Adapter\Polyfill\StreamedCopyTrait;
use League\Flysystem\AdapterInterface;
use League\Flysystem\Config;
use League\Flysystem\Util;
use RuntimeException;

class Ftp extends AbstractFtpAdapter
{
    use StreamedCopyTrait;

    /**
     * @var int
     */
    protected $transferMode = FTP_BINARY;

    /**
     * @var null|bool
     */
    protected $ignorePassiveAddress = null;

    /**
     * @var array
     */
    protected $configurable = [
        'host',
        'port',
        'username',
        'password',
        'ssl',
        'timeout',
        'root',
        'permPrivate',
        'permPublic',
        'passive',
        'transferMode',
        'systemType',
        'ignorePassiveAddress',
    ];

    /**
     * Set the transfer mode.
     *
     * @param int $mode
     *
     * @return $this
     */
    public function setTransferMode($mode)
    {
        $this->transferMode = $mode;

        return $this;
    }

    /**
     * Set if Ssl is enabled.
     *
     * @param bool $ssl
     *
     * @return $this
     */
    public function setSsl($ssl)
    {
        $this->ssl = (bool) $ssl;

        return $this;
    }

    /**
     * Set if passive mode should be used.
     *
     * @param bool $passive
     */
    public function setPassive($passive = true)
    {
        $this->passive = $passive;
    }

    /**
     * @param bool $ignorePassiveAddress
     */
    public function setIgnorePassiveAddress($ignorePassiveAddress)
    {
        $this->ignorePassiveAddress = $ignorePassiveAddress;
    }

    /**
     * Connect to the FTP server.
     */
    public function connect()
    {
        if ($this->ssl) {
            $this->connection = ftp_ssl_connect($this->getHost(), $this->getPort(), $this->getTimeout());
        } else {
            $this->connection = ftp_connect($this->getHost(), $this->getPort(), $this->getTimeout());
        }

        if ( ! $this->connection) {
            throw new RuntimeException('Could not connect to host: ' . $this->getHost() . ', port:' . $this->getPort());
        }

        $this->login();
        $this->setConnectionPassiveMode();
        $this->setConnectionRoot();
    }

    /**
     * Set the connections to passive mode.
     *
     * @throws RuntimeException
     */
    protected function setConnectionPassiveMode()
    {
        if (is_bool($this->ignorePassiveAddress) && defined('FTP_USEPASVADDRESS')) {
            ftp_set_option($this->connection, FTP_USEPASVADDRESS, ! $this->ignorePassiveAddress);
        }

        if ( ! ftp_pasv($this->connection, $this->passive)) {
            throw new RuntimeException(
                'Could not set passive mode for connection: ' . $this->getHost() . '::' . $this->getPort()
            );
        }
    }

    /**
     * Set the connection root.
     */
    protected function setConnectionRoot()
    {
        $root = $this->getRoot();
        $connection = $this->connection;

        if (empty($root) === false && ! ftp_chdir($connection, $root)) {
            throw new RuntimeException('Root is invalid or does not exist: ' . $this->getRoot());
        }

        // Store absolute path for further reference.
        // This is needed when creating directories and
        // initial root was a relative path, else the root
        // would be relative to the chdir'd path.
        $this->root = ftp_pwd($connection);
    }

    /**
     * Login.
     *
     * @throws RuntimeException
     */
    protected function login()
    {
        set_error_handler(
            function () {
            }
        );
        $isLoggedIn = ftp_login($this->connection, $this->getUsername(), $this->getPassword());
        restore_error_handler();

        if ( ! $isLoggedIn) {
            $this->disconnect();
            throw new RuntimeException(
                'Could not login with connection: ' . $this->getHost() . '::' . $this->getPort(
                ) . ', username: ' . $this->getUsername()
            );
        }
    }

    /**
     * Disconnect from the FTP server.
     */
    public function disconnect()
    {
        if ($this->isConnected()) {
            ftp_close($this->connection);
        }

        $this->connection = null;
    }

    /**
     * @inheritdoc
     */
    public function write($path, $contents, Config $config)
    {
        $stream = fopen('php://temp', 'w+b');
        fwrite($stream, $contents);
        rewind($stream);
        $result = $this->writeStream($path, $stream, $config);
        fclose($stream);

        if ($result === false) {
            return false;
        }

        $result['contents'] = $contents;
        $result['mimetype'] = Util::guessMimeType($path, $contents);

        return $result;
    }

    /**
     * @inheritdoc
     */
    public function writeStream($path, $resource, Config $config)
    {
        $this->ensureDirectory(Util::dirname($path));

        if ( ! ftp_fput($this->getConnection(), $path, $resource, $this->transferMode)) {
            return false;
        }

        if ($visibility = $config->get('visibility')) {
            $this->setVisibility($path, $visibility);
        }

        return compact('path', 'visibility');
    }

    /**
     * @inheritdoc
     */
    public function update($path, $contents, Config $config)
    {
        return $this->write($path, $contents, $config);
    }

    /**
     * @inheritdoc
     */
    public function updateStream($path, $resource, Config $config)
    {
        return $this->writeStream($path, $resource, $config);
    }

    /**
     * @inheritdoc
     */
    public function rename($path, $newpath)
    {
        return ftp_rename($this->getConnection(), $path, $newpath);
    }

    /**
     * @inheritdoc
     */
    public function delete($path)
    {
        return ftp_delete($this->getConnection(), $path);
    }

    /**
     * @inheritdoc
     */
    public function deleteDir($dirname)
    {
        $connection = $this->getConnection();
        $contents = array_reverse($this->listDirectoryContents($dirname));

        foreach ($contents as $object) {
            if ($object['type'] === 'file') {
                if ( ! ftp_delete($connection, $object['path'])) {
                    return false;
                }
            } elseif ( ! ftp_rmdir($connection, $object['path'])) {
                return false;
            }
        }

        return ftp_rmdir($connection, $dirname);
    }

    /**
     * @inheritdoc
     */
    public function createDir($dirname, Config $config)
    {
        $connection = $this->getConnection();
        $directories = explode('/', $dirname);

        foreach ($directories as $directory) {
            if (false === $this->createActualDirectory($directory, $connection)) {
                $this->setConnectionRoot();

                return false;
            }

            ftp_chdir($connection, $directory);
        }

        $this->setConnectionRoot();

        return ['path' => $dirname];
    }

    /**
     * Create a directory.
     *
     * @param string   $directory
     * @param resource $connection
     *
     * @return bool
     */
    protected function createActualDirectory($directory, $connection)
    {
        // List the current directory
        $listing = ftp_nlist($connection, '.') ?: [];
        
        foreach ($listing as $key => $item) {
            if (preg_match('~^\./.*~', $item)) {
                $listing[$key] = substr($item, 2);
            }
        }

        if (in_array($directory, $listing)) {
            return true;
        }

        return (boolean) ftp_mkdir($connection, $directory);
    }

    /**
     * @inheritdoc
     */
    public function getMetadata($path)
    {
        $connection = $this->getConnection();

        if ($path === '') {
            return ['type' => 'dir', 'path' => ''];
        }

        if (@ftp_chdir($connection, $path) === true) {
            $this->setConnectionRoot();

            return ['type' => 'dir', 'path' => $path];
        }

        $listing = ftp_rawlist($connection, '-A ' . str_replace('*', '\\*', $path));

        if (empty($listing)) {
            return false;
        }

        if (preg_match('/.* not found/', $listing[0])) {
            return false;
        }

        if (preg_match('/^total [0-9]*$/', $listing[0])) {
            array_shift($listing);
        }

        return $this->normalizeObject($listing[0], '');
    }

    /**
     * @inheritdoc
     */
    public function getMimetype($path)
    {
        if ( ! $metadata = $this->read($path)) {
            return false;
        }

        $metadata['mimetype'] = Util::guessMimeType($path, $metadata['contents']);

        return $metadata;
    }

    /**
     * @inheritdoc
     */
    public function getTimestamp($path)
    {
        $timestamp = ftp_mdtm($this->getConnection(), $path);

        return ($timestamp !== -1) ? ['timestamp' => $timestamp] : false;
    }

    /**
     * @inheritdoc
     */
    public function read($path)
    {
        if ( ! $object = $this->readStream($path)) {
            return false;
        }

        $object['contents'] = stream_get_contents($object['stream']);
        fclose($object['stream']);
        unset($object['stream']);

        return $object;
    }

    /**
     * @inheritdoc
     */
    public function readStream($path)
    {
        $stream = fopen('php://temp', 'w+');
        $result = ftp_fget($this->getConnection(), $stream, $path, $this->transferMode);
        rewind($stream);

        if ( ! $result) {
            fclose($stream);

            return false;
        }

        return compact('stream');
    }

    /**
     * @inheritdoc
     */
    public function setVisibility($path, $visibility)
    {
        $mode = $visibility === AdapterInterface::VISIBILITY_PUBLIC ? $this->getPermPublic() : $this->getPermPrivate();

        if ( ! ftp_chmod($this->getConnection(), $mode, $path)) {
            return false;
        }

        return compact('visibility');
    }

    /**
     * @inheritdoc
     *
     * @param string $directory
     */
    protected function listDirectoryContents($directory, $recursive = true)
    {
        $directory = str_replace('*', '\\*', $directory);
        $options = $recursive ? '-alnR' : '-aln';
        $listing = ftp_rawlist($this->getConnection(), $options . ' ' . $directory);

        return $listing ? $this->normalizeListing($listing, $directory) : [];
    }

    /**
     * Check if the connection is open.
     *
     * @return bool
     * @throws ErrorException
     */
    public function isConnected()
    {
        try {
            return is_resource($this->connection) && ftp_systype($this->connection) !== false;
        } catch (ErrorException $e) {
            fclose($this->connection);
            $this->connection = null;

            if (strpos($e->getMessage(), 'ftp_systype') === false) {
                throw $e;
            }

            return false;
        }
    }
}
