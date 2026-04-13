
import { existsSync } from 'fs';
import fs from 'fs';
import { getVolumeFromFs } from 'memfs-extra';

jest.mock('fs');

describe('jest mock fs', () =>
{
	it('should mock fs, and has fs.readJSON', () =>
	{
		expect(fs).toHaveProperty('readJSON');
	});

	it('should get volume from fs', () =>
	{
		const vol = getVolumeFromFs(fs as any);
		expect(vol).toHaveProperty('fromJSON');
	});

	it('should can control volume', () =>
	{
		const vol = getVolumeFromFs(fs as any);

		vol.fromJSON({
			'./test-not-exists': 'abc',
		});

		expect(fs.readFileSync('./test-not-exists').toString()).toBe('abc');
	});
});

describe('mock fs showcase', () =>
{
	it('should mock fs', () =>
	{
		const vol = getVolumeFromFs((fs as any));

		vol.mkdirSync('/test-not-exists');
		vol.appendFileSync('/test-not-exists3', 'test-not-exists3');

		vol.fromJSON({
			'/test-not-exists3': 'test-not-exists3-updated',
		});

		expect(existsSync('/test-not-exists')).toBe(true);
		expect(existsSync('/test-not-exists2')).toBe(false);

		expect(existsSync('/test-not-exists3')).toBe(true);

	});
});
