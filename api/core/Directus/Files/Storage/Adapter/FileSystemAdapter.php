<?php

namespace Directus\Files\Storage\Adapter;

class FileSystemAdapter extends Adapter {

	public function fileExists($fileName, $destination) {
		$path = $this->joinPaths($destination, $fileName);
		return file_exists($path);
	}

	protected function writeFile($localFile, $targetFileName, $destination) {
		$path = $this->joinPaths($destination, $targetFileName);

		// @todo optionally use move_uploaded_file, for security
		// $move = move_uploaded_file($localFile, $path);

		// Don't overwrite!
		if(file_exists($path)) {
			return false;
		}
		$move = copy($localFile, $path);
		return $move;
	}

	public function getFileContents($fileName, $destination) {
		$path = $this->joinPaths($destination, $fileName);
		return file_get_contents($path);
	}

}
