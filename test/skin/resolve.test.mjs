import { test } from 'node:test'
import assert from 'node:assert/strict'
import { originalUrls, customUrls, resolvePartImages } from '../../js/skin/resolve.js'

function fakeLoader(available) {
	return (url) => (available.includes(url)
		? Promise.resolve(`image:${url}`)
		: Promise.reject(new Error(`missing ${url}`)))
}

test('originalUrls uses name.png for single frames and name-N.png for animations', () => {
	assert.deepEqual(originalUrls({ name: 'bg-sky', frames: 1 }, 'orig'), ['orig/bg-sky.png'])
	assert.deepEqual(originalUrls({ name: 'player-run', frames: 2 }, 'orig'), [
		'orig/player-run-1.png',
		'orig/player-run-2.png'
	])
})

test('customUrls encodes file names safely', () => {
	assert.deepEqual(customUrls(['my run 1.png'], 'skin'), ['skin/my%20run%201.png'])
})

test('resolvePartImages uses custom images when at least one loads', async () => {
	const load = fakeLoader(['skin/a-1.png'])

	const result = await resolvePartImages(['skin/a-1.png', 'skin/a-2.png'], ['orig/a-1.png'], load)

	assert.deepEqual(result, {
		images: ['image:skin/a-1.png'],
		isCustom: true,
		failed: ['skin/a-2.png']
	})
})

test('resolvePartImages falls back to the originals when no custom image loads', async () => {
	const load = fakeLoader(['orig/a-1.png', 'orig/a-2.png'])

	const result = await resolvePartImages(['skin/a-1.png'], ['orig/a-1.png', 'orig/a-2.png'], load)

	assert.deepEqual(result, {
		images: ['image:orig/a-1.png', 'image:orig/a-2.png'],
		isCustom: false,
		failed: ['skin/a-1.png']
	})
})

test('resolvePartImages rejects when an original image is missing', async () => {
	const load = fakeLoader([])

	await assert.rejects(resolvePartImages([], ['orig/a-1.png'], load), /orig\/a-1\.png/)
})
