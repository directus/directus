<?php

namespace Directus\Media\Storage;

class FileSystemAdapter extends Adapter {

	private function fileExists($fileName, $destination) {
		$path = $this->joinPaths($destination, $fileName);
		return file_exists($path);
	}

	private function writeFile($localFile, $targetFileName, $destination) {
		$path = $this->joinPaths($destination, $targetFileName);
        return move_uploaded_file($localFile, $path);
	}

}
