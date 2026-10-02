// 換圖清單：每個部位的檔名、動畫格數、在遊戲中的大小與縮放方式
// fit: 'fill' 拉滿整格（背景用）、'bottom' 等比縮放貼齊底部、'center' 等比縮放置中
// mask: 是否用圖片的不透明區域當碰撞範圍
// clearSky: 山會疊在其他背景前面，自訂圖上方的純色天空要變透明

export const SKIN_DIR = 'assets/skin'
export const ORIGINAL_DIR = 'assets/skin-original'
export const SKIN_FILES_INDEX = 'skin-files.json'

function part(name, label, frames, width, height, fit, options = {}) {
	return Object.freeze({
		name,
		label,
		frames,
		width,
		height,
		fit,
		mask: Boolean(options.mask),
		clearSky: Boolean(options.clearSky)
	})
}

const OBSTACLE = { mask: true }
const MOUNTAIN = { clearSky: true }

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
const COUNTDOWN_DIGITS = [1, 2, 3]

export const PARTS = Object.freeze([
	part('player-run', '主角：跑步', 2, 96, 108, 'bottom'),
	part('player-duck', '主角：蹲下', 2, 96, 108, 'bottom'),
	part('player-jump', '主角：跳躍', 2, 96, 108, 'bottom'),
	part('player-dead', '主角：撞到倒下', 5, 96, 108, 'bottom'),

	part('ground-slime', '地面怪：史萊姆（要跳過）', 4, 156, 72, 'bottom', OBSTACLE),
	part('ground-snake-pink', '地面怪：粉紅蛇（要跳過）', 2, 104, 80, 'bottom', OBSTACLE),
	part('ground-snake-yellow', '地面怪：黃蛇（要跳過）', 2, 104, 80, 'bottom', OBSTACLE),
	part('air-saucer', '空中怪：飛碟（要蹲下）', 3, 168, 116, 'bottom', OBSTACLE),
	part('air-dragon', '空中怪：龍（要蹲下）', 2, 188, 192, 'bottom', OBSTACLE),

	part('bg-sky', '背景：天空', 1, 1400, 572, 'fill'),
	part('bg-mountain-far', '背景：遠山', 1, 1400, 453, 'fill', MOUNTAIN),
	part('bg-mountain-mid', '背景：中山', 1, 1400, 342, 'fill', MOUNTAIN),
	part('bg-mountain-near', '背景：近山', 1, 1400, 100, 'fill', MOUNTAIN),
	part('bg-ground', '背景：地面', 1, 1400, 196, 'fill'),

	part('text-start', '文字：開始畫面標題', 1, 700, 88, 'center'),
	part('text-title', '文字：遊戲標題', 1, 554, 70, 'center'),
	part('text-duck', '文字：拍手蹲下', 1, 600, 113, 'center'),
	part('text-jump', '文字：喊「喔」跳躍', 1, 594, 84, 'center'),
	part('text-retry', '文字：拍手重來', 1, 446, 112, 'center'),

	part('hint-clap', '教學圖示：拍手', 3, 144, 204, 'center'),
	part('hint-say', '教學圖示：說話', 3, 155, 148, 'center'),

	part('score-board', '分數底板', 1, 100, 52, 'fill'),
	...DIGITS.map((digit) => part(`score-${digit}`, `分數數字 ${digit}`, 1, 20, 28, 'center')),
	...COUNTDOWN_DIGITS.map((digit) => part(`countdown-${digit}`, `倒數數字 ${digit}`, 1, 80, 116, 'center'))
])

export function findPart(name) {
	return PARTS.find((item) => item.name === name) || null
}
