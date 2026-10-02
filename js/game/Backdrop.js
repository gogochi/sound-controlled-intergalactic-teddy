import TweenMax from 'gsap'
import Q from './../main.js'

class Backdrop {
	constructor(x, flipped = false) {
		this.x = x
		this.y = 0
		this.width = 1400
		this.height = 572
		this.flipped = flipped
	}

	render(context) {
		Q.skin.draw(context, 'bg-sky', 0, this.x, this.y, this.width, this.height, this.flipped)
	}
}

export default Backdrop