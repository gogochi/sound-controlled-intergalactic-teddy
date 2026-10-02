import Q from './../main.js'

class Number {
	constructor() {
		this.value = null

		this.width = 20
		this.height = 28

		this.x = 0
		this.y = 0
	}

	set(value) {
		this.value = value
	}

	clear() {
		this.value = 0
	}

	render(context) {
		// value 為 'x' 時代表前面補空白，score-x 不存在所以不會畫
		Q.skin.draw(context, `score-${this.value}`, 0, this.x, this.y, this.width, this.height)
	}
}

export default Number