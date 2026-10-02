import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
	normalizeName,
	matchSkinFiles,
	describeProblem,
	isSkinCandidate,
	parseDirectoryListing
} from '../../js/skin/files.js'

const FOLDER = 'http://localhost:8000/assets/skin/'

const PARTS = [
	{ name: 'player-run', frames: 2 },
	{ name: 'bg-sky', frames: 1 },
	{ name: 'score-1', frames: 1 }
]

test('normalizeName lowercases and turns spaces/underscores into dashes', () => {
	assert.equal(normalizeName('Player_Run 2.PNG'), 'player-run-2')
	assert.equal(normalizeName('  bg-sky.webp '), 'bg-sky')
})

test('normalizeName tolerates stray spaces, dashes and doubled extensions', () => {
	assert.equal(normalizeName('player-run-1 .png'), 'player-run-1')
	assert.equal(normalizeName('player-dead - 1.png'), 'player-dead-1')
	assert.equal(normalizeName('player-duck-1.png.png'), 'player-duck-1')
	assert.equal(normalizeName('_bg-sky-.png'), 'bg-sky')
})

test('matchSkinFiles assigns numbered frames in frame order', () => {
	const result = matchSkinFiles(PARTS, ['player-run-2.png', 'player-run-1.png'])

	assert.deepEqual(result.assignments['player-run'], ['player-run-1.png', 'player-run-2.png'])
	assert.deepEqual(result.problems, [])
})

test('matchSkinFiles accepts jpg/webp and loose naming', () => {
	const result = matchSkinFiles(PARTS, ['Player_Run 1.JPG', 'bg-sky.webp'])

	assert.deepEqual(result.assignments['player-run'], ['Player_Run 1.JPG'])
	assert.deepEqual(result.assignments['bg-sky'], ['bg-sky.webp'])
})

test('matchSkinFiles treats a bare name as frame 1 and -1 on single-frame parts', () => {
	const result = matchSkinFiles(PARTS, ['player-run.png', 'bg-sky-1.png'])

	assert.deepEqual(result.assignments['player-run'], ['player-run.png'])
	assert.deepEqual(result.assignments['bg-sky'], ['bg-sky-1.png'])
})

test('matchSkinFiles prefers exact part names over frame suffixes', () => {
	const result = matchSkinFiles(PARTS, ['score-1.png'])

	assert.deepEqual(result.assignments['score-1'], ['score-1.png'])
})

test('matchSkinFiles reports unknown names, unsupported formats and out-of-range frames', () => {
	const result = matchSkinFiles(PARTS, ['hello.png', 'player-run-3.png', 'player-run-0.png', 'bg-sky.psd'])

	assert.deepEqual(result.assignments, {})
	assert.deepEqual(result.problems, [
		{ file: 'hello.png', reason: 'unknown' },
		{ file: 'player-run-3.png', reason: 'frame-out-of-range', limit: 2 },
		{ file: 'player-run-0.png', reason: 'frame-out-of-range', limit: 2 },
		{ file: 'bg-sky.psd', reason: 'unsupported' }
	])
})

test('matchSkinFiles keeps the numbered file when a bare name duplicates frame 1', () => {
	const result = matchSkinFiles(PARTS, ['player-run.png', 'player-run-1.png'])

	assert.deepEqual(result.assignments['player-run'], ['player-run-1.png'])
	assert.deepEqual(result.problems, [{ file: 'player-run.png', reason: 'duplicate' }])
})

test('matchSkinFiles ignores non-string entries from the index file', () => {
	const result = matchSkinFiles(PARTS, [42, null, 'bg-sky.png'])

	assert.deepEqual(result.assignments, { 'bg-sky': ['bg-sky.png'] })
	assert.deepEqual(result.problems, [])
})

test('isSkinCandidate skips docs, hidden and system files', () => {
	assert.equal(isSkinCandidate('player-run-1.png'), true)
	assert.equal(isSkinCandidate('_說明.md'), false)
	assert.equal(isSkinCandidate('.DS_Store'), false)
	assert.equal(isSkinCandidate('Thumbs.db'), false)
	assert.equal(isSkinCandidate('desktop.ini'), false)
})

test('parseDirectoryListing reads a python http.server listing with encoded names', () => {
	const html = `<ul>
		<li><a href="_%E8%AA%AA%E6%98%8E.md">_說明.md</a></li>
		<li><a href="player-run-1.png">player-run-1.png</a></li>
		<li><a href="my%20slime.png">my slime.png</a></li>
		<li><a href="sub/">sub/</a></li>
	</ul>`

	assert.deepEqual(parseDirectoryListing(html, FOLDER), ['_說明.md', 'player-run-1.png', 'my slime.png'])
})

test('parseDirectoryListing reads absolute links and skips parent, sort and outside links', () => {
	const html = `
		<a href="/assets" title="..">..</a>
		<a href="?C=N;O=D">Name</a>
		<a href="/assets/skin/bg-sky.png" class="icon" title="bg-sky.png">bg-sky.png</a>
		<a href="/assets/skin/a&amp;b.png">a&amp;b.png</a>
		<a href="/bundle.js">bundle</a>
		<a href="https://example.com/assets/skin/x.png">x</a>
		<a href="/assets/skin/bg-sky.png">duplicate</a>`

	assert.deepEqual(parseDirectoryListing(html, FOLDER), ['bg-sky.png', 'a&b.png'])
})

test('parseDirectoryListing returns nothing for pages that are not listings', () => {
	assert.deepEqual(parseDirectoryListing('<html><script src="bundle.js"></script></html>', FOLDER), [])
	assert.deepEqual(parseDirectoryListing('<a href="%E0%A4%A.png">bad</a>', FOLDER), [])
})

test('describeProblem explains each reason in plain words', () => {
	assert.match(describeProblem({ file: 'a.png', reason: 'unknown' }), /a\.png.*檔名/)
	assert.match(describeProblem({ file: 'a.png', reason: 'frame-out-of-range', limit: 2 }), /1～2/)
	assert.match(describeProblem({ file: 'a.psd', reason: 'unsupported' }), /png/)
	assert.match(describeProblem({ file: 'a.png', reason: 'duplicate' }), /重複/)
	assert.match(describeProblem({ file: 'a.png', reason: 'load-failed' }), /重新整理/)
	assert.match(describeProblem({ file: 'skin-files.json', reason: 'index-invalid' }), /重新整理/)
	assert.match(describeProblem({ file: 'a.png', reason: 'something-else' }), /a\.png/)
})
