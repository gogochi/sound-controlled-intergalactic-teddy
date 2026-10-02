import Q from './../main.js'

class BigNumber {
	constructor() {
		this.value = null

		this.width = 80
		this.height = 116

		this.x = 0
		this.y = 0
		this.show = true
	}

	set(value) {
		this.show = true
		this.value = value
	}

	clear() {
		this.value = 0
		this.show = false
	}

	render(context) {
		if (this.show) {
			Q.skin.draw(context, `countdown-${this.value}`, 0, this.x, this.y, this.width, this.height)
		}
	}
}

export default BigNumber