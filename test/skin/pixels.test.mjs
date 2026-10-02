import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
	pickFrame,
	fitRect,
	alphaBounds,
	frameBounds,
	removeBackground,
	maskFromPixels
} from '../../js/skin/pixels.js'

// 用字元畫出 RGBA 像素：'.' 透明、'w' 白、'r' 紅、'g' 綠
const COLORS = {
	'.': [0, 0, 0, 0],
	w: [255, 255, 255, 255],
	r: [255, 0, 0, 255],
	g: [0, 200, 0, 255]
}

function draw(rows) {
	const height = rows.length
	const width = rows[0].length
	const pixels = new Uint8ClampedArray(width * height * 4)
	rows.forEach((row, y) => {
		row.split('').forEach((char, x) => {
			pixels.set(COLORS[char], (y * width + x) * 4)
		})
	})
	return { pixels, width, height }
}

function alphaRows({ pixels, width, height }) {
	const rows = []
	for (let y = 0; y < height; y += 1) {
		let row = ''
		for (let x = 0; x < width; x += 1) {
			row += pixels[(y * width + x) * 4 + 3] === 0 ? '.' : '#'
		}
		rows.push(row)
	}
	return rows
}

test('pickFrame cycles through the available frames', () => {
	assert.equal(pickFrame(['a', 'b'], 0), 'a')
	assert.equal(pickFrame(['a', 'b'], 3), 'b')
	assert.equal(pickFrame(['a'], 4), 'a')
	assert.equal(pickFrame([], 0), null)
	assert.equal(pickFrame(undefined, 0), null)
})

test('fitRect fill stretches to the whole box', () => {
	assert.deepEqual(fitRect(10, 10, 100, 50, 'fill'), { x: 0, y: 0, width: 100, height: 50 })
})

test('fitRect bottom keeps aspect ratio and sits on the bottom edge', () => {
	assert.deepEqual(fitRect(100, 100, 50, 80, 'bottom'), { x: 0, y: 30, width: 50, height: 50 })
})

test('fitRect center keeps aspect ratio and centers in the box', () => {
	assert.deepEqual(fitRect(200, 100, 100, 100, 'center'), { x: 0, y: 25, width: 100, height: 50 })
})

test('fitRect falls back to the whole box for empty sources', () => {
	assert.deepEqual(fitRect(0, 0, 30, 20, 'center'), { x: 0, y: 0, width: 30, height: 20 })
})

test('alphaBounds finds the visible area', () => {
	const image = draw([
		'.....',
		'..r..',
		'..rr.',
		'.....'
	])

	assert.deepEqual(alphaBounds(image.pixels, image.width, image.height), { x: 2, y: 1, width: 2, height: 2 })
})

test('alphaBounds returns null for a fully transparent image', () => {
	const image = draw(['...', '...'])

	assert.equal(alphaBounds(image.pixels, image.width, image.height), null)
})

test('frameBounds shares one union box when all frames have the same size', () => {
	const frames = [
		{ width: 10, height: 10, bounds: { x: 2, y: 2, width: 3, height: 3 } },
		{ width: 10, height: 10, bounds: { x: 4, y: 1, width: 4, height: 2 } }
	]
	const union = { x: 2, y: 1, width: 6, height: 4 }

	assert.deepEqual(frameBounds(frames), [union, union])
})

test('frameBounds keeps each box when frame sizes differ', () => {
	const frames = [
		{ width: 10, height: 10, bounds: { x: 2, y: 2, width: 3, height: 3 } },
		{ width: 20, height: 10, bounds: null }
	]

	assert.deepEqual(frameBounds(frames), [
		{ x: 2, y: 2, width: 3, height: 3 },
		{ x: 0, y: 0, width: 20, height: 10 }
	])
})

test('frameBounds uses the whole frame when every frame is empty', () => {
	const frames = [{ width: 4, height: 3, bounds: null }]

	assert.deepEqual(frameBounds(frames), [{ x: 0, y: 0, width: 4, height: 3 }])
})

test('removeBackground clears a solid background connected to the border', () => {
	const image = draw([
		'wwwww',
		'wrrrw',
		'wrwrw',
		'wrrrw',
		'wwwww'
	])

	const result = removeBackground(image.pixels, image.width, image.height)

	assert.deepEqual(alphaRows({ ...image, pixels: result }), [
		'.....',
		'.###.',
		'.###.',
		'.###.',
		'.....'
	])
})

test('removeBackground does not modify the input', () => {
	const image = draw(['ww', 'wr'])
	const before = Array.from(image.pixels)

	removeBackground(image.pixels, image.width, image.height)

	assert.deepEqual(Array.from(image.pixels), before)
})

test('removeBackground leaves images that already have transparency', () => {
	const image = draw(['.ww', 'wrw', 'www'])

	const result = removeBackground(image.pixels, image.width, image.height)

	assert.deepEqual(Array.from(result), Array.from(image.pixels))
})

test('removeBackground leaves full scenes whose corners differ', () => {
	const image = draw(['wwg', 'wrw', 'www'])

	const result = removeBackground(image.pixels, image.width, image.height)

	assert.deepEqual(Array.from(result), Array.from(image.pixels))
})

test('removeBackground with top edges clears only the sky above a silhouette', () => {
	const image = draw([
		'wwwww',
		'wwgww',
		'wgggw',
		'ggggg'
	])

	const result = removeBackground(image.pixels, image.width, image.height, 'top')

	assert.deepEqual(alphaRows({ ...image, pixels: result }), [
		'.....',
		'..#..',
		'.###.',
		'#####'
	])
})

test('removeBackground with top edges needs matching top corners', () => {
	const image = draw(['wwg', 'ggg'])

	const result = removeBackground(image.pixels, image.width, image.height, 'top')

	assert.deepEqual(Array.from(result), Array.from(image.pixels))
})

test('maskFromPixels counts semi-transparent parts like the saucer glass dome as solid', () => {
	const pixels = new Uint8ClampedArray([255, 255, 255, 75, 255, 255, 255, 10])

	assert.deepEqual(maskFromPixels([pixels], 2, 1), [['x'], [' ']])
})

test('maskFromPixels marks pixels solid in any frame, indexed as mask[x][y]', () => {
	const first = draw(['r..', '...'])
	const second = draw(['...', '..r'])

	const mask = maskFromPixels([first.pixels, second.pixels], 3, 2)

	assert.deepEqual(mask, [
		['x', ' '],
		[' ', ' '],
		[' ', 'x']
	])
})
