// 把 assets/skin 裡的檔名對應到部位，並找出對不上的檔案

const IMAGE_EXTENSION = /\.(png|jpe?g|webp|gif)$/i
const FRAME_SUFFIX = /^(.+)-(\d+)$/
const LINK = /<a\s[^>]*href\s*=\s*["']([^"']+)["']/gi
const SYSTEM_FILES = ['thumbs.db', 'desktop.ini']

// 說明檔（_ 開頭）、隱藏檔和系統檔都不是圖片
export function isSkinCandidate(name) {
	return !name.startsWith('.') && !name.startsWith('_') && !SYSTEM_FILES.includes(name.toLowerCase())
}

function fileInFolder(href, folder) {
	let url
	try {
		url = new URL(href.replace(/&amp;/g, '&'), folder)
	} catch (error) {
		return null
	}
	if (url.origin !== folder.origin || url.search || !url.pathname.startsWith(folder.pathname)) {
		return null
	}
	const rest = url.pathname.slice(folder.pathname.length)
	if (rest === '' || rest.includes('/')) {
		return null
	}
	try {
		return decodeURIComponent(rest)
	} catch (error) {
		return null
	}
}

// 讀取本機伺服器（Live Server、python http.server）產生的資料夾清單頁，
// 讓直接放進編譯好資料夾的圖片不用重新 build 也能被找到
export function parseDirectoryListing(html, folderUrl) {
	const folder = new URL(folderUrl)
	const names = []
	LINK.lastIndex = 0
	let match = LINK.exec(html)
	while (match !== null) {
		const name = fileInFolder(match[1], folder)
		if (name && !names.includes(name)) {
			names.push(name)
		}
		match = LINK.exec(html)
	}
	return names
}

// 容許常見的手誤：多餘空白、「 - 」、Windows 隱藏副檔名造成的 .png.png
export function normalizeName(file) {
	let base = file.trim()
	while (IMAGE_EXTENSION.test(base)) {
		base = base.replace(IMAGE_EXTENSION, '').trim()
	}
	return base.toLowerCase().replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
}

function locate(file, partsByName) {
	const base = normalizeName(file)
	if (partsByName.has(base)) {
		return { part: partsByName.get(base), frame: 1, isBare: true }
	}
	const match = FRAME_SUFFIX.exec(base)
	if (match && partsByName.has(match[1])) {
		return { part: partsByName.get(match[1]), frame: parseInt(match[2], 10), isBare: false }
	}
	return null
}

function classify(file, partsByName) {
	if (!IMAGE_EXTENSION.test(file.trim())) {
		return { problem: { file, reason: 'unsupported' } }
	}
	const target = locate(file, partsByName)
	if (!target) {
		return { problem: { file, reason: 'unknown' } }
	}
	if (target.frame < 1 || target.frame > target.part.frames) {
		return { problem: { file, reason: 'frame-out-of-range', limit: target.part.frames } }
	}
	return { slot: { file, name: target.part.name, frame: target.frame, isBare: target.isBare } }
}

// 有編號的檔案優先，其次依檔名排序，讓重複時的結果固定
function compareSlots(a, b) {
	if (a.isBare !== b.isBare) {
		return a.isBare ? 1 : -1
	}
	return a.file < b.file ? -1 : 1
}

export function matchSkinFiles(parts, files) {
	const partsByName = new Map(parts.map((part) => [part.name, part]))
	const classified = files
		.filter((file) => typeof file === 'string')
		.map((file) => classify(file, partsByName))

	const problems = classified.filter((item) => item.problem).map((item) => item.problem)
	const slots = classified.filter((item) => item.slot).map((item) => item.slot).sort(compareSlots)

	const taken = new Set()
	const chosen = []
	slots.forEach((slot) => {
		const key = `${slot.name}#${slot.frame}`
		if (taken.has(key)) {
			problems.push({ file: slot.file, reason: 'duplicate' })
		} else {
			taken.add(key)
			chosen.push(slot)
		}
	})

	const assignments = {}
	chosen
		.sort((a, b) => a.frame - b.frame)
		.forEach((slot) => {
			assignments[slot.name] = (assignments[slot.name] || []).concat(slot.file)
		})

	return { assignments, problems }
}

export function describeProblem(problem) {
	const file = problem.file
	switch (problem.reason) {
		case 'unknown':
			return `${file}：檔名對不上任何圖片，請對照 _說明.md 的檔名`
		case 'frame-out-of-range':
			return `${file}：動畫編號要在 1～${problem.limit} 之間`
		case 'unsupported':
			return `${file}：格式不支援，請存成 png、jpg 或 webp`
		case 'duplicate':
			return `${file}：跟另一張圖重複了，這張沒有使用`
		case 'load-failed':
			return `${file}：圖片讀取失敗，可能還在複製或檔案損壞，請稍後重新整理`
		case 'index-invalid':
			return `${file}：圖片清單讀取失敗，自訂圖片暫時沒有套用，請重新整理`
		default:
			return `${file}：沒有使用`
	}
}
