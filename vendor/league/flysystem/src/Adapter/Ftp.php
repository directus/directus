<?php

namespace League\Flysystem\Adapter;

use ErrorException;
use League\Flysystem\Adapter\Polyfill\StreamedCopyTrait;
use League\Flysystem\AdapterInterface;
use League\Flysystem\Config;
use League\Flysystem\ConnectionErrorException;
use League\Flysystem\ConnectionRuntimeException;
use League\Flysystem\InvalidRootException;
use League\Flysystem\Util;
use League\Flysystem\Util\MimeType;

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
     * @var bool
     */
    protected $recurseManually = false;

    /**
     * @var bool
     */
    protected $utf8 = false;

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
        'recurseManually',
        'utf8',
        'enableTimestampsOnUnixListings',
    ];

    /**
     * @var bool
     */
    protected $isPureFtpd;

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
     * @param bool $recurseManually
     */
    public function setRecurseManually($recurseManually)
    {
        $this->recurseManually = $recurseManually;
    }

    /**
     * @param bool $utf8
     */
    public function setUtf8($utf8)
    {
        $this->utf8 = (bool) $utf8;
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
            throw new ConnectionRuntimeException('Could not connect to host: ' . $this->getHost() . ', port:' . $this->getPort());
        }

        $this->login();
        $this->setUtf8Mode();
        $this->setConnectionPassiveMode();
        $this->setConnectionRoot();
        $this->isPureFtpd = $this->isPureFtpdServer();
    }

    /**
     * Set the connection to UTF-8 mode.
     */
    protected function setUtf8Mode()
    {
        if ($this->utf8) {
            $response = ftp_raw($this->connection, "OPTS UTF8 ON");
            if (substr($response[0], 0, 3) !== '200') {
                throw new ConnectionRuntimeException(
                    'Could not set UTF-8 mode for connection: ' . $this->getHost() . '::' . $this->getPort()
                );
            }
        }
    }

    /**
     * Set the connections to passive mode.
     *
     * @throws ConnectionRuntimeException
     */
    protected function setConnectionPassiveMode()
    {
        if (is_bool($this->ignorePassiveAddress) && defined('FTP_USEPASVADDRESS')) {
            ftp_set_option($this->connection, FTP_USEPASVADDRESS, ! $this->ignorePassiveAddress);
        }

        if ( ! ftp_pasv($this->connection, $this->passive)) {
            throw new ConnectionRuntimeException(
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

        if ($root && ! ftp_chdir($connection, $root)) {
            throw new InvalidRootException('Root is invalid or does not exist: ' . $this->getRoot());
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
     * @throws ConnectionRuntimeException
     */
    protected function login()
    {
        set_error_handler(function () {
        });
        $isLoggedIn = ftp_login(
            $this->connection,
            $this->getUsername(),
            $this->getPassword()
        );
        restore_error_handler();

        if ( ! $isLoggedIn) {
            $this->disconnect();
            throw new ConnectionRuntimeException(
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
        if (is_resource($this->connection)) {
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
        $result['mimetype'] = $config->get('mimetype') ?: Util::guessMimeType($path, $contents);

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

        $type = 'file';

        return compact('type', 'path', 'visibility');
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
        $contents = array_reverse($this->listDirectoryContents($dirname, false));

        foreach ($contents as $object) {
            if ($object['type'] === 'file') {
                if ( ! ftp_delete($connection, $object['path'])) {
                    return false;
                }
            } elseif ( ! $this->deleteDir($object['path'])) {
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

        return ['type' => 'dir', 'path' => $dirname];
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

        if (in_array($directory, $listing, true)) {
            return true;
        }

        return (boolean) ftp_mkdir($connection, $directory);
    }

    /**
     * @inheritdoc
     */
    public function getMetadata($path)
    {
        if ($path === '') {
            return ['type' => 'dir', 'path' => ''];
        }

        if (@ftp_chdir($this->getConnection(), $path) === true) {
            $this->setConnectionRoot();

            return ['type' => 'dir', 'path' => $path];
        }

        $listing = $this->ftpRawlist('-A', str_replace('*', '\\*', $path));

        if (empty($listing) || in_array('total 0', $listing, true)) {
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
        if ( ! $metadata = $this->getMetadata($path)) {
            return false;
        }

        $metadata['mimetype'] = MimeType::detectByFilename($path);

        return $metadata;
    }

    /**
     * @inheritdoc
     */
    public function getTimestamp($path)
    {
        $timestamp = ftp_mdtm($this->getConnection(), $path);

        return ($timestamp !== -1) ? ['path' => $path, 'timestamp' => $timestamp] : false;
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
        $stream = fopen('php://temp', 'w+b');
        $result = ftp_fget($this->getConnection(), $stream, $path, $this->transferMode);
        rewind($stream);

        if ( ! $result) {
            fclose($stream);

            return false;
        }

        return ['type' => 'file', 'path' => $path, 'stream' => $stream];
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

        return compact('path', 'visibility');
    }

    /**
     * @inheritdoc
     *
     * @param string $directory
     */
    protected function listDirectoryContents($directory, $recursive = true)
    {
        $directory = str_replace('*', '\\*', $directory);

        if ($recursive && $this->recurseManually) {
            return $this->listDirectoryContentsRecursive($directory);
        }

        $options = $recursive ? '-alnR' : '-aln';
        $listing = $this->ftpRawlist($options, $directory);

        return $listing ? $this->normalizeListing($listing, $directory) : [];
    }

    /**
     * @inheritdoc
     *
     * @param string $directory
     */
    protected function listDirectoryContentsRecursive($directory)
    {
        $listing = $this->normalizeListing($this->ftpRawlist('-aln', $directory) ?: [], $directory);
        $output = [];

        foreach ($listing as $item) {
            $output[] = $item;
            if ($item['type'] !== 'dir') {
                continue;
            }
            $output = array_merge($output, $this->listDirectoryContentsRecursive($item['path']));
        }

        return $output;
    }

    /**
     * Check if the connection is open.
     *
     * @return bool
     *
     * @throws ConnectionErrorException
     */
    public function isConnected()
    {
        return is_resource($this->connection)
            && $this->getRawExecResponseCode('NOOP') === 200;
    }

    /**
     * @return bool
     */
    protected function isPureFtpdServer()
    {
        $response = ftp_raw($this->connection, 'HELP');

        return stripos(implode(' ', $response), 'Pure-FTPd') !== false;
    }

    /**
     * The ftp_rawlist function with optional escaping.
     *
     * @param string $options
     * @param string $path
     *
     * @return array
     */
    protected function ftpRawlist($options, $path)
    {
        $connection = $this->getConnection();

        if ($this->isPureFtpd) {
            $path = str_replace(' ', '\ ', $path);
        }

        return ftp_rawlist($connection, $options . ' ' . $path);
    }

    private function getRawExecResponseCode($command)
    {
        $response = @ftp_raw($this->connection, trim($command));

        return (int) preg_replace('/\D/', '', implode(' ', $response));
    }
}
