import { test } from 'node:test'
import assert from 'node:assert/strict'
import { snapshotFileName, isSnapshotKey } from '../../js/ai/spectrumSnapshot.js'

test('snapshotFileName uses the local date and time so files never overwrite each other', () => {
	const date = new Date(2026, 9, 2, 9, 5, 7)

	assert.equal(snapshotFileName(date), 'spectrum-20261002-090507.png')
})

test('isSnapshotKey accepts plain S in either case', () => {
	assert.equal(isSnapshotKey({ key: 's' }), true)
	assert.equal(isSnapshotKey({ key: 'S', shiftKey: true }), true)
})

test('isSnapshotKey ignores other keys and browser shortcuts like Ctrl+S', () => {
	assert.equal(isSnapshotKey({ key: 'a' }), false)
	assert.equal(isSnapshotKey({ key: 's', ctrlKey: true }), false)
	assert.equal(isSnapshotKey({ key: 's', metaKey: true }), false)
	assert.equal(isSnapshotKey({ key: 's', altKey: true }), false)
	assert.equal(isSnapshotKey({ key: 's', repeat: true }), false)
})
