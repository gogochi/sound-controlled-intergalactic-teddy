import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PARTS, ORIGINAL_DIR, findPart } from '../../js/skin/manifest.js'
import { originalUrls } from '../../js/skin/resolve.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const FITS = ['fill', 'bottom', 'center']

function pngSize(file) {
	const header = readFileSync(file)
	return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) }
}

test('every part has a unique name and valid settings', () => {
	const names = PARTS.map((part) => part.name)

	assert.equal(new Set(names).size, names.length)
	PARTS.forEach((part) => {
		assert.match(part.name, /^[a-z0-9-]+$/, part.name)
		assert.ok(part.label, `${part.name} needs a label`)
		assert.ok(Number.isInteger(part.frames) && part.frames >= 1, part.name)
		assert.ok(part.width > 0 && part.height > 0, part.name)
		assert.ok(FITS.includes(part.fit), part.name)
	})
})

test('only obstacles use their pixels as hit masks', () => {
	const masked = PARTS.filter((part) => part.mask).map((part) => part.name)

	assert.deepEqual(masked, ['ground-slime', 'ground-snake-pink', 'ground-snake-yellow', 'air-saucer', 'air-dragon'])
})

test('only mountain layers clear their sky, because they sit in front of other layers', () => {
	const clearing = PARTS.filter((part) => part.clearSky).map((part) => part.name)

	assert.deepEqual(clearing, ['bg-mountain-far', 'bg-mountain-mid', 'bg-mountain-near'])
})

test('findPart looks parts up by name', () => {
	assert.equal(findPart('bg-sky').width, 1400)
	assert.equal(findPart('nope'), null)
})

test('skin-original has every frame at the exact in-game size', () => {
	PARTS.forEach((part) => {
		originalUrls(part, ORIGINAL_DIR).forEach((url) => {
			const size = pngSize(join(ROOT, url))
			assert.deepEqual(size, { width: part.width, height: part.height }, url)
		})
	})
})

test('skin-original contains no files the manifest does not know about', () => {
	const expected = new Set(PARTS.flatMap((part) => originalUrls(part, '.').map((url) => url.slice(2))))
	const actual = readdirSync(join(ROOT, ORIGINAL_DIR))

	assert.deepEqual(actual.filter((file) => !expected.has(file)), [])
})
