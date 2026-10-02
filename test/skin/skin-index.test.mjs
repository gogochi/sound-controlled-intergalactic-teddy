import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, utimesSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import skinIndex from '../../scripts/skin-index.js'

const { listSkinFiles, writeIndex, syncSkinFiles } = skinIndex

function withTempDir(run) {
	const dir = mkdtempSync(join(tmpdir(), 'skin-index-'))
	try {
		run(dir)
	} finally {
		rmSync(dir, { recursive: true, force: true })
	}
}

test('listSkinFiles lists files sorted, skipping docs, hidden and system files', () => {
	withTempDir((dir) => {
		;['b.png', 'a.jpg', '_說明.md', '_對照圖.png', '.DS_Store', 'Thumbs.db', 'desktop.ini']
			.forEach((name) => writeFileSync(join(dir, name), ''))
		mkdirSync(join(dir, 'folder'))

		assert.deepEqual(listSkinFiles(dir), ['a.jpg', 'b.png'])
	})
})

test('listSkinFiles returns an empty list when the folder is missing', () => {
	assert.deepEqual(listSkinFiles(join(tmpdir(), 'does-not-exist-skin')), [])
})

test('writeIndex writes the list as JSON, creates the folder and leaves no temp file', () => {
	withTempDir((dir) => {
		const output = join(dir, 'nested', 'skin-files.json')

		writeIndex(['a.png'], output)

		assert.deepEqual(JSON.parse(readFileSync(output, 'utf8')), ['a.png'])
		assert.deepEqual(readdirSync(join(dir, 'nested')), ['skin-files.json'])
	})
})

test('syncSkinFiles copies new and changed images and removes deleted ones', () => {
	withTempDir((dir) => {
		const source = join(dir, 'skin')
		const target = join(dir, 'public', 'skin')
		mkdirSync(source)
		mkdirSync(target, { recursive: true })
		writeFileSync(join(source, 'new.png'), 'new')
		writeFileSync(join(source, 'changed.png'), 'version 2')
		writeFileSync(join(target, 'changed.png'), 'v1')
		writeFileSync(join(target, 'deleted.png'), 'old')
		writeFileSync(join(target, '_說明.md'), 'docs')

		syncSkinFiles(source, target, ['changed.png', 'new.png'])

		assert.equal(readFileSync(join(target, 'new.png'), 'utf8'), 'new')
		assert.equal(readFileSync(join(target, 'changed.png'), 'utf8'), 'version 2')
		assert.deepEqual(readdirSync(target).sort(), ['_說明.md', 'changed.png', 'new.png'])
	})
})

test('syncSkinFiles notices a replaced file even when its size and date look older', () => {
	withTempDir((dir) => {
		const source = join(dir, 'skin')
		const target = join(dir, 'public')
		mkdirSync(source)
		writeFileSync(join(source, 'a.png'), 'AAAA')
		syncSkinFiles(source, target, ['a.png'])

		writeFileSync(join(source, 'a.png'), 'BBBB')
		const old = new Date('2020-01-01T00:00:00Z')
		utimesSync(join(source, 'a.png'), old, old)
		syncSkinFiles(source, target, ['a.png'])

		assert.equal(readFileSync(join(target, 'a.png'), 'utf8'), 'BBBB')
		assert.equal(statSync(join(target, 'a.png')).mtimeMs, statSync(join(source, 'a.png')).mtimeMs)
	})
})
