import { test } from 'node:test'
import assert from 'node:assert/strict'
import Skin from '../../js/skin/Skin.js'

function fakeContext() {
	const calls = []
	const record = (name) => (...args) => calls.push([name, ...args])
	return {
		calls,
		save: record('save'),
		restore: record('restore'),
		translate: record('translate'),
		scale: record('scale'),
		drawImage: record('drawImage')
	}
}

function createSkin() {
	return new Skin({
		'player-run': { frames: ['run1', 'run2'], mask: null, isCustom: false },
		'bg-sky': { frames: ['sky'], mask: null, isCustom: true },
		'ground-slime': { frames: [{ toDataURL: () => 'data:slime' }], mask: [['x']], isCustom: true }
	}, [{ file: 'x.png', reason: 'unknown' }])
}

test('frame cycles frames and returns null for unknown parts', () => {
	const skin = createSkin()

	assert.equal(skin.frame('player-run', 1), 'run2')
	assert.equal(skin.frame('player-run', 2), 'run1')
	assert.equal(skin.frame('score-x'), null)
})

test('frameCount comes from the manifest, not from how many images were supplied', () => {
	const skin = createSkin()

	assert.equal(skin.frameCount('player-dead'), 5)
	assert.equal(skin.frameCount('nope'), 0)
})

test('mask, isCustom, imageUrl and problems expose part data', () => {
	const skin = createSkin()

	assert.deepEqual(skin.mask('ground-slime'), [['x']])
	assert.equal(skin.mask('player-run'), null)
	assert.equal(skin.mask('nope'), null)
	assert.equal(skin.isCustom('bg-sky'), true)
	assert.equal(skin.isCustom('player-run'), false)
	assert.equal(skin.isCustom('nope'), false)
	assert.equal(skin.imageUrl('ground-slime'), 'data:slime')
	assert.equal(skin.imageUrl('nope'), '')
	assert.deepEqual(skin.problems, [{ file: 'x.png', reason: 'unknown' }])
})

test('draw paints the frame into the given box', () => {
	const context = fakeContext()

	createSkin().draw(context, 'player-run', 1, 10, 20, 96, 108)

	assert.deepEqual(context.calls, [['drawImage', 'run2', 10, 20, 96, 108]])
})

test('draw skips unknown parts silently', () => {
	const context = fakeContext()

	createSkin().draw(context, 'score-x', 0, 0, 0, 20, 28)

	assert.deepEqual(context.calls, [])
})

test('draw mirrors flipped tiles only for custom images', () => {
	const custom = fakeContext()
	const original = fakeContext()

	createSkin().draw(custom, 'bg-sky', 0, 100, 0, 1400, 572, true)
	createSkin().draw(original, 'player-run', 0, 100, 0, 96, 108, true)

	assert.deepEqual(custom.calls, [
		['save'],
		['translate', 1500, 0],
		['scale', -1, 1],
		['drawImage', 'sky', 0, 0, 1400, 572],
		['restore']
	])
	assert.deepEqual(original.calls, [['drawImage', 'run1', 100, 0, 96, 108]])
})
