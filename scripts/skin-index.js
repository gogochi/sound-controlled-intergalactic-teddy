// 列出 assets/skin 裡的檔案，寫成 public/skin-files.json 給遊戲讀取
// 用法：node scripts/skin-index.js [--watch]
// --watch 時也會把圖片同步到 public/assets/skin：WSL 的 /mnt/c 收不到 Windows 端的檔案變更事件，
// cpx 的 watch 會漏掉新圖，所以這裡用輪詢自己同步
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const SKIN_DIR = path.join(ROOT, 'assets', 'skin')
const PUBLIC_SKIN_DIR = path.join(ROOT, 'public', 'assets', 'skin')
const OUTPUT_FILE = path.join(ROOT, 'public', 'skin-files.json')
const POLL_INTERVAL_MS = 1000
const SYSTEM_FILES = ['thumbs.db', 'desktop.ini']

function isSkinCandidate(name) {
	return !name.startsWith('.') && !name.startsWith('_') && !SYSTEM_FILES.includes(name.toLowerCase())
}

function listSkinFiles(dir) {
	if (!fs.existsSync(dir)) {
		return []
	}
	return fs.readdirSync(dir, { withFileTypes: true })
		.filter((entry) => entry.isFile() && isSkinCandidate(entry.name))
		.map((entry) => entry.name)
		.sort()
}

// 先寫暫存檔再改名，遊戲不會讀到寫到一半的清單
function writeIndex(files, outputFile) {
	fs.mkdirSync(path.dirname(outputFile), { recursive: true })
	const temporary = `${outputFile}.tmp`
	fs.writeFileSync(temporary, JSON.stringify(files, null, 2) + '\n')
	fs.renameSync(temporary, outputFile)
}

function isSameFile(source, target) {
	if (!fs.existsSync(target)) {
		return false
	}
	const a = fs.statSync(source)
	const b = fs.statSync(target)
	return a.size === b.size && a.mtimeMs === b.mtimeMs
}

// 複製新增或變更的圖片、刪掉來源已移除的圖片；說明檔等 _ 開頭的檔案不動
function syncSkinFiles(sourceDir, targetDir, files) {
	fs.mkdirSync(targetDir, { recursive: true })
	files.forEach((name) => {
		const source = path.join(sourceDir, name)
		const target = path.join(targetDir, name)
		if (!isSameFile(source, target)) {
			fs.copyFileSync(source, target)
			const stat = fs.statSync(source)
			fs.utimesSync(target, stat.atime, stat.mtime)
		}
	})
	listSkinFiles(targetDir)
		.filter((name) => !files.includes(name))
		.forEach((name) => fs.unlinkSync(path.join(targetDir, name)))
}

function update(previous, shouldSync) {
	const files = listSkinFiles(SKIN_DIR)
	if (shouldSync) {
		syncSkinFiles(SKIN_DIR, PUBLIC_SKIN_DIR, files)
	}
	const serialized = JSON.stringify(files)
	if (serialized !== previous) {
		writeIndex(files, OUTPUT_FILE)
		console.log(`[skin] ${files.length} custom image(s) listed in public/skin-files.json`)
	}
	return serialized
}

function watch() {
	let previous = update(null, true)
	setInterval(() => {
		try {
			previous = update(previous, true)
		} catch (error) {
			console.error(`[skin] could not sync ${SKIN_DIR}: ${error.message}`)
		}
	}, POLL_INTERVAL_MS)
}

if (require.main === module) {
	if (process.argv.includes('--watch')) {
		watch()
	} else {
		update(null, false)
	}
}

module.exports = { listSkinFiles, writeIndex, syncSkinFiles }
