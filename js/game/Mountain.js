import TweenMax from 'gsap'
import Q from './../main.js'

const MOUNTAIN_PARTS = ['bg-mountain-far', 'bg-mountain-mid', 'bg-mountain-near']

class Mountain {
	constructor(index, flipped = false) {
		this.part = MOUNTAIN_PARTS[index]
		this.flipped = flipped

		if (index === 0) {
			this.x = 0
			this.y = 60
			this.width = 1400
			this.height = 453
		}else if (index === 1) {
			this.x = 0
			this.y = 200
			this.width = 1400
			this.height = 342
		}else if (index === 2) {
			this.x = 0
			this.y = 368
			this.width = 1400
			this.height = 100
		}

	}

	render(context) {
		Q.skin.draw(context, this.part, 0, this.x, this.y, this.width, this.height, this.flipped)
	}
}

export default Mountain