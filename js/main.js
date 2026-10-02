import Game from './game/Game.js'
import loadSkin from './skin/loadSkin.js'
import { describeProblem } from './skin/files.js'
let Q = {}

function showStartTitle(skin) {
	let image = document.querySelector('.start-title')
	if (image) {
		image.src = skin.imageUrl('text-start')
	}
}

// 檔名打錯等問題直接顯示在開始畫面，不用打開開發者工具
function showSkinProblems(problems) {
	let list = document.querySelector('.skin-problems')
	if (!list || problems.length === 0) {
		return
	}
	problems.forEach((problem) => {
		let item = document.createElement('li')
		item.textContent = describeProblem(problem)
		list.appendChild(item)
	})
	list.hidden = false
	console.warn('[skin]', problems)
}

// 圖片處理完才能開始，載入期間先顯示 Loading，避免點了沒反應
function showStartReady() {
	let message = document.querySelector('.start-message')
	if (message) {
		message.textContent = 'Click anywhere to start game'
	}
}

function showStartError(error) {
	console.error(error)
	let message = document.querySelector('.start-message')
	if (message) {
		message.textContent = `遊戲無法啟動：${error.message}`
	}
}

function doubleClick(event) {
	if (document.webkitIsFullScreen) {
		document.webkitExitFullscreen()
	}else {
		document.body.webkitRequestFullscreen()
	}
}

function init() {
	Q.width = 720
	Q.height = 576
	window.addEventListener('dblclick', doubleClick);
	// 直接雙擊 index.html 時瀏覽器不准讀圖片像素，也不能用麥克風
	if (window.location.protocol === 'file:') {
		showStartError(new Error('請用本機伺服器開啟，不能直接雙擊 index.html（做法見 assets/skin/_說明.md）'))
		return
	}
	loadSkin()
		.then((skin) => {
			Q.skin = skin
			showStartTitle(skin)
			showSkinProblems(skin.problems)
			Q.GAME = new Game()
			showStartReady()
		})
		.catch(showStartError)
}

window.addEventListener('load', init)

export default Q
