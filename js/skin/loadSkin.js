// 瀏覽器端：讀取所有部位的圖片，處理成遊戲裡的大小，組成 Skin
import { PARTS, SKIN_DIR, ORIGINAL_DIR, SKIN_FILES_INDEX } from './manifest.js'
import { matchSkinFiles, isSkinCandidate, parseDirectoryListing } from './files.js'
import { originalUrls, customUrls, resolvePartImages } from './resolve.js'
import { fitRect, alphaBounds, frameBounds, removeBackground, maskFromPixels } from './pixels.js'
import Skin from './Skin.js'

function loadImage(url) {
	return new Promise((resolve, reject) => {
		const image = new Image()
		image.onload = () => resolve(image)
		image.onerror = () => reject(new Error(`找不到圖片：${decodeURIComponent(url)}`))
		image.src = url
	})
}

// 沒有 skin-files.json（例如還沒 build）就當作沒有自訂圖；內容壞掉則提示使用者
function fetchSkinFiles() {
	const invalid = { files: [], problems: [{ file: SKIN_FILES_INDEX, reason: 'index-invalid' }] }
	return fetch(SKIN_FILES_INDEX, { cache: 'no-store' }).then(
		(response) => {
			if (!response.ok) {
				return { files: [], problems: [] }
			}
			return response.json().then(
				(files) => (Array.isArray(files) ? { files, problems: [] } : invalid),
				() => invalid
			)
		},
		() => ({ files: [], problems: [] })
	)
}

// 本機伺服器若提供資料夾清單，就以實際檔案為準（拿到編譯好的資料夾直接放圖也能用）；
// 沒有清單的網站（例如 GitHub Pages）才改用 build 時產生的 skin-files.json
function fetchDirectoryListing() {
	const folderUrl = new URL(`${SKIN_DIR}/`, window.location.href).href
	return fetch(folderUrl, { cache: 'no-store' })
		.then((response) => {
			const type = response.headers.get('content-type') || ''
			if (!response.ok || !type.includes('text/html')) {
				return null
			}
			return response.text().then((html) => {
				const names = parseDirectoryListing(html, folderUrl)
				return names.length > 0 ? names.filter(isSkinCandidate) : null
			})
		})
		.catch(() => null)
}

function findSkinFiles() {
	return fetchDirectoryListing().then((files) => (files ? { files, problems: [] } : fetchSkinFiles()))
}

function createCanvas(width, height) {
	const canvas = document.createElement('canvas')
	canvas.width = width
	canvas.height = height
	return canvas
}

function readPixels(canvas) {
	return canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data
}

function toCanvas(image) {
	const canvas = createCanvas(image.naturalWidth || image.width, image.naturalHeight || image.height)
	canvas.getContext('2d').drawImage(image, 0, 0)
	return canvas
}

function withoutBackground(canvas, edges) {
	const pixels = removeBackground(readPixels(canvas), canvas.width, canvas.height, edges)
	const cleaned = createCanvas(canvas.width, canvas.height)
	cleaned.getContext('2d').putImageData(new ImageData(pixels, canvas.width, canvas.height), 0, 0)
	return cleaned
}

// 縮小時平滑處理；放大時保持像素銳利
function drawInto(part, source, from) {
	const to = fitRect(from.width, from.height, part.width, part.height, part.fit)
	const canvas = createCanvas(part.width, part.height)
	const context = canvas.getContext('2d')
	context.imageSmoothingEnabled = to.width < from.width
	context.imageSmoothingQuality = 'high'
	context.drawImage(source, from.x, from.y, from.width, from.height, to.x, to.y, to.width, to.height)
	return canvas
}

function renderCustomFrames(part, images) {
	const sources = images.map(toCanvas)
	if (part.fit === 'fill') {
		return sources
			.map((source) => (part.clearSky ? withoutBackground(source, 'top') : source))
			.map((source) => drawInto(part, source, { x: 0, y: 0, width: source.width, height: source.height }))
	}
	const cleaned = sources.map((source) => withoutBackground(source, 'all'))
	const bounds = frameBounds(cleaned.map((canvas) => ({
		width: canvas.width,
		height: canvas.height,
		bounds: alphaBounds(readPixels(canvas), canvas.width, canvas.height)
	})))
	return cleaned.map((canvas, index) => drawInto(part, canvas, bounds[index]))
}

function renderOriginalFrames(part, images) {
	return images.map((image) => drawInto(part, image, { x: 0, y: 0, width: part.width, height: part.height }))
}

function preparePart(part, files) {
	return resolvePartImages(customUrls(files, SKIN_DIR), originalUrls(part, ORIGINAL_DIR), loadImage)
		.then(({ images, isCustom, failed }) => {
			const frames = isCustom ? renderCustomFrames(part, images) : renderOriginalFrames(part, images)
			const mask = part.mask ? maskFromPixels(frames.map(readPixels), part.width, part.height) : null
			const problems = failed.map((url) => ({ file: decodeURIComponent(url.split('/').pop()), reason: 'load-failed' }))
			return { name: part.name, data: { frames, mask, isCustom }, problems }
		})
}

export default function loadSkin() {
	return findSkinFiles().then((index) => {
		const matched = matchSkinFiles(PARTS, index.files)
		const pending = PARTS.map((part) => preparePart(part, matched.assignments[part.name] || []))
		return Promise.all(pending).then((results) => {
			const parts = {}
			results.forEach((result) => {
				parts[result.name] = result.data
			})
			const problems = results.reduce(
				(all, result) => all.concat(result.problems),
				index.problems.concat(matched.problems)
			)
			return new Skin(parts, problems)
		})
	})
}
