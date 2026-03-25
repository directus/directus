import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock all external dependencies before any imports
vi.mock('chalk', () => ({
	default: {
		blue: vi.fn((text) => `BLUE(${text})`),
		bold: vi.fn((text) => `BOLD(${text})`),
		yellow: {
			bold: vi.fn((text) => `YELLOW_BOLD(${text})`),
		},
		cyan: vi.fn((text) => `CYAN(${text})`),
	},
}));

vi.mock('fs-extra', () => ({
	default: {
		pathExists: vi.fn(),
		stat: vi.fn(),
		readdir: vi.fn(),
		mkdir: vi.fn(),
		readFile: vi.fn(() => Promise.resolve('{"name":"create-directus-project","version":"12.0.1"}')),
	},
}));

vi.mock('execa', () => ({
	execa: vi.fn(),
}));

vi.mock('log-symbols', () => ({
	default: {
		error: '✖',
		warning: '⚠',
	},
}));

vi.mock('ora', () => {
	const mockSpinner = {
		start: vi.fn(),
		stop: vi.fn(),
		stopAndPersist: vi.fn(),
	};

	return {
		default: vi.fn(() => mockSpinner),
	};
});

vi.mock('update-check', () => ({
	default: vi.fn(),
}));

vi.mock('./check-requirements.js', () => ({
	default: vi.fn(),
}));

// Import after mocks are set up
const { create } = await import('./index.js');

describe('create function', () => {
	let mockFse;
	let mockExeca;
	let mockOra;
	let mockCheckForUpdate;
	let mockCheckRequirements;
	let mockConsoleError;
	let mockConsoleLog;
	let mockProcessExit;
	let mockSpinner;

	beforeEach(async () => {
		// Import mocked modules
		const fse = await import('fs-extra');
		const { execa } = await import('execa');
		const ora = await import('ora');
		const checkForUpdate = await import('update-check');
		const checkRequirements = await import('./check-requirements.js');

		mockFse = fse.default;
		mockExeca = execa;
		mockOra = ora.default;
		mockCheckForUpdate = checkForUpdate.default;
		mockCheckRequirements = checkRequirements.default;

		// Mock console methods
		mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
		mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

		// Mock process.exit
		mockProcessExit = vi.spyOn(process, 'exit').mockImplementation((code) => {
			throw new Error(`process.exit called with ${code}`);
		});

		// Get the mock spinner that ora returns
		mockSpinner = mockOra();

		// Reset all mocks
		vi.clearAllMocks();
	});

	afterEach(() => {
		mockConsoleError.mockRestore();
		mockConsoleLog.mockRestore();
		mockProcessExit.mockRestore();
	});

	describe('directory validation', () => {
		it('should create directory if it does not exist', async () => {
			// Arrange
			mockFse.pathExists.mockResolvedValue(false);
			mockFse.mkdir.mockResolvedValue();
			mockExeca.mockResolvedValue();
			mockCheckForUpdate.mockResolvedValue(null);

			// Act & Assert
			await expect(() => create('test-project')).rejects.toThrow('process.exit called with 0');
			expect(mockFse.pathExists).toHaveBeenCalledWith(expect.stringContaining('test-project'));
			expect(mockFse.mkdir).toHaveBeenCalledWith(expect.stringContaining('test-project'));
		});

		it('should exit if destination exists and is not a directory', async () => {
			// Arrange
			mockFse.pathExists.mockResolvedValue(true);
			mockFse.stat.mockResolvedValue({ isDirectory: () => false });

			// Act & Assert
			await expect(() => create('test-project')).rejects.toThrow('process.exit called with 1');
			expect(mockProcessExit).toHaveBeenCalledWith(1);
			expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('already exists and is not a directory'));
		});

		it('should exit if destination exists and is not empty', async () => {
			// Arrange
			mockFse.pathExists.mockResolvedValue(true);
			mockFse.stat.mockResolvedValue({ isDirectory: () => true });
			mockFse.readdir.mockResolvedValue(['file1.txt', 'file2.txt']);

			// Act & Assert
			await expect(() => create('test-project')).rejects.toThrow('process.exit called with 1');
			expect(mockProcessExit).toHaveBeenCalledWith(1);

			expect(mockConsoleError).toHaveBeenCalledWith(
				expect.stringContaining('already exists and is not an empty directory'),
			);
		});

		it('should proceed if destination exists and is empty', async () => {
			// Arrange
			mockFse.pathExists.mockResolvedValue(true);
			mockFse.stat.mockResolvedValue({ isDirectory: () => true });
			mockFse.readdir.mockResolvedValue([]);
			mockFse.mkdir.mockResolvedValue();
			mockExeca.mockResolvedValue();
			mockCheckForUpdate.mockResolvedValue(null);

			// Act & Assert
			await expect(() => create('test-project')).rejects.toThrow('process.exit called with 0');
			expect(mockFse.mkdir).toHaveBeenCalledWith(expect.stringContaining('uploads'));
			expect(mockFse.mkdir).toHaveBeenCalledWith(expect.stringContaining('extensions'));
		});
	});

	describe('project setup', () => {
		beforeEach(() => {
			mockFse.pathExists.mockResolvedValue(false);
			mockFse.mkdir.mockResolvedValue();
		});

		it('should create required directories', async () => {
			// Arrange
			mockExeca.mockResolvedValue();
			mockCheckForUpdate.mockResolvedValue(null);

			// Act & Assert
			await expect(() => create('test-project')).rejects.toThrow('process.exit called with 0');
			expect(mockFse.mkdir).toHaveBeenCalledWith(expect.stringContaining('test-project/uploads'));
			expect(mockFse.mkdir).toHaveBeenCalledWith(expect.stringContaining('test-project/extensions'));
		});

		it('should initialize npm project', async () => {
			// Arrange
			mockExeca.mockResolvedValue();
			mockCheckForUpdate.mockResolvedValue(null);

			// Act & Assert
			await expect(() => create('test-project')).rejects.toThrow('process.exit called with 0');

			expect(mockExeca).toHaveBeenCalledWith(
				'npm',
				['init', '-y'],
				expect.objectContaining({
					cwd: expect.stringContaining('test-project'),
					stdin: 'ignore',
				}),
			);
		});

		it('should install Directus package', async () => {
			// Arrange
			mockExeca.mockResolvedValue();
			mockCheckForUpdate.mockResolvedValue(null);

			// Act & Assert
			await expect(() => create('test-project')).rejects.toThrow('process.exit called with 0');

			expect(mockExeca).toHaveBeenCalledWith(
				'npm',
				['install', 'directus', '--omit=dev'],
				expect.objectContaining({
					cwd: expect.stringContaining('test-project'),
					stdin: 'ignore',
				}),
			);
		});

		it('should initialize Directus project', async () => {
			// Arrange
			mockExeca.mockResolvedValue();
			mockCheckForUpdate.mockResolvedValue(null);

			// Act & Assert
			await expect(() => create('test-project')).rejects.toThrow('process.exit called with 0');

			expect(mockExeca).toHaveBeenCalledWith(
				'npx',
				['directus', 'init'],
				expect.objectContaining({
					cwd: expect.stringContaining('test-project'),
					stdio: 'inherit',
				}),
			);
		});
	});

	describe('error handling', () => {
		beforeEach(() => {
			mockFse.pathExists.mockResolvedValue(false);
			mockFse.mkdir.mockResolvedValue();
		});

		it('should handle npm init error', async () => {
			// Arrange
			const npmError = new Error('npm init failed');
			Object.assign(npmError, { stderr: 'npm init error details' });

			mockExeca
				.mockRejectedValueOnce(npmError) // npm init fails
				.mockResolvedValue(); // other calls succeed

			// Act & Assert
			await expect(() => create('test-project')).rejects.toThrow('process.exit called with 1');
			expect(mockProcessExit).toHaveBeenCalledWith(1);
			expect(mockConsoleError).toHaveBeenCalledWith('npm init error details');
		});

		it('should handle npm install error', async () => {
			// Arrange
			const installError = new Error('npm install failed');
			Object.assign(installError, { stdout: 'npm install error details' });

			mockExeca
				.mockResolvedValueOnce() // npm init succeeds
				.mockRejectedValueOnce(installError) // npm install fails
				.mockResolvedValue(); // other calls succeed

			// Act & Assert
			await expect(() => create('test-project')).rejects.toThrow('process.exit called with 1');
			expect(mockProcessExit).toHaveBeenCalledWith(1);
			expect(mockConsoleError).toHaveBeenCalledWith('npm install error details');
		});

		it('should handle directus init error', async () => {
			// Arrange
			mockExeca
				.mockResolvedValueOnce() // npm init succeeds
				.mockResolvedValueOnce() // npm install succeeds
				.mockRejectedValueOnce(); // directus init fails

			// Act & Assert
			await expect(() => create('test-project')).rejects.toThrow('process.exit called with 1');
			expect(mockProcessExit).toHaveBeenCalledWith(1);

			expect(mockSpinner.stopAndPersist).toHaveBeenCalledWith(
				expect.objectContaining({
					text: expect.stringContaining('Error while initializing the project'),
				}),
			);
		});
	});

	describe('spinner behavior', () => {
		beforeEach(() => {
			mockFse.pathExists.mockResolvedValue(false);
			mockFse.mkdir.mockResolvedValue();
			mockExeca.mockResolvedValue();
			mockCheckForUpdate.mockResolvedValue(null);
		});

		it('should start and stop spinner during installation', async () => {
			// Act & Assert
			await expect(() => create('test-project')).rejects.toThrow('process.exit called with 0');
			expect(mockSpinner.start).toHaveBeenCalledWith(expect.stringContaining('Installing Directus'));
			expect(mockSpinner.stop).toHaveBeenCalled();
		});

		it('should create spinner with bunny animation', async () => {
			// Act & Assert
			await expect(() => create('test-project')).rejects.toThrow('process.exit called with 0');

			expect(mockOra).toHaveBeenCalledWith(
				expect.objectContaining({
					spinner: expect.objectContaining({
						interval: 520,
						frames: expect.arrayContaining([expect.stringContaining('🐰')]),
					}),
				}),
			);
		});
	});

	describe('update checking', () => {
		beforeEach(() => {
			mockFse.pathExists.mockResolvedValue(false);
			mockFse.mkdir.mockResolvedValue();
			mockExeca.mockResolvedValue();
		});

		it('should check for updates and display message if available', async () => {
			// Arrange
			const updateInfo = { latest: '1.2.3' };
			mockCheckForUpdate.mockResolvedValue(updateInfo);

			// Act & Assert
			await expect(() => create('test-project')).rejects.toThrow('process.exit called with 0');
			expect(mockCheckForUpdate).toHaveBeenCalled();
			expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('A new version'));
			expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('npm i -g'));
		});

		it('should not display update message if no update available', async () => {
			// Arrange
			mockCheckForUpdate.mockResolvedValue(null);

			// Act & Assert
			await expect(() => create('test-project')).rejects.toThrow('process.exit called with 0');
			expect(mockCheckForUpdate).toHaveBeenCalled();
			expect(mockConsoleLog).not.toHaveBeenCalledWith(expect.stringContaining('A new version'));
		});

		it('should handle update check error gracefully', async () => {
			// Arrange
			mockCheckForUpdate.mockRejectedValue(new Error('Update check failed'));

			// Act & Assert
			await expect(() => create('test-project')).rejects.toThrow('process.exit called with 0');

			expect(mockSpinner.stopAndPersist).toHaveBeenCalledWith(
				expect.objectContaining({
					symbol: expect.stringContaining('⚠'),
					text: expect.stringContaining('Error while checking for newer version'),
				}),
			);

			expect(mockProcessExit).toHaveBeenCalledWith(0); // Should not exit with error
		});
	});

	describe('requirements checking', () => {
		it('should call checkRequirements at the start', async () => {
			// Arrange
			mockFse.pathExists.mockResolvedValue(false);
			mockFse.mkdir.mockResolvedValue();
			mockExeca.mockResolvedValue();
			mockCheckForUpdate.mockResolvedValue(null);

			// Act & Assert
			await expect(() => create('test-project')).rejects.toThrow('process.exit called with 0');
			expect(mockCheckRequirements).toHaveBeenCalled();
		});
	});

	describe('successful completion', () => {
		it('should exit with code 0 on successful completion', async () => {
			// Arrange
			mockFse.pathExists.mockResolvedValue(false);
			mockFse.mkdir.mockResolvedValue();
			mockExeca.mockResolvedValue();
			mockCheckForUpdate.mockResolvedValue(null);

			// Act & Assert
			await expect(() => create('test-project')).rejects.toThrow('process.exit called with 0');
			expect(mockProcessExit).toHaveBeenCalledWith(0);
		});
	});

	describe('edge cases', () => {
		it('should handle error without stderr or stdout', async () => {
			// Arrange
			mockFse.pathExists.mockResolvedValue(false);
			mockFse.mkdir.mockResolvedValue();

			const simpleError = new Error('Simple error');
			mockExeca.mockRejectedValueOnce(simpleError);

			// Act & Assert
			await expect(() => create('test-project')).rejects.toThrow('process.exit called with 1');
			expect(mockProcessExit).toHaveBeenCalledWith(1);
			expect(mockConsoleError).toHaveBeenCalledWith('Unknown error');
		});

		it('should handle error with only stderr', async () => {
			// Arrange
			mockFse.pathExists.mockResolvedValue(false);
			mockFse.mkdir.mockResolvedValue();

			const errorWithStderr = new Error('Error with stderr');
			Object.assign(errorWithStderr, { stderr: 'Error details in stderr' });
			mockExeca.mockRejectedValueOnce(errorWithStderr);

			// Act & Assert
			await expect(() => create('test-project')).rejects.toThrow('process.exit called with 1');
			expect(mockProcessExit).toHaveBeenCalledWith(1);
			expect(mockConsoleError).toHaveBeenCalledWith('Error details in stderr');
		});

		it('should handle error with only stdout', async () => {
			// Arrange
			mockFse.pathExists.mockResolvedValue(false);
			mockFse.mkdir.mockResolvedValue();

			const errorWithStdout = new Error('Error with stdout');
			Object.assign(errorWithStdout, { stdout: 'Error details in stdout' });

			mockExeca
				.mockResolvedValueOnce() // npm init succeeds
				.mockRejectedValueOnce(errorWithStdout); // npm install fails

			// Act & Assert
			await expect(() => create('test-project')).rejects.toThrow('process.exit called with 1');
			expect(mockProcessExit).toHaveBeenCalledWith(1);
			expect(mockConsoleError).toHaveBeenCalledWith('Error details in stdout');
		});
	});
});
