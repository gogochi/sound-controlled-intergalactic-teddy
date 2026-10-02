import TweenMax from 'gsap'
import Q from './../main'

const TITLE_PARTS = {
	main: 'text-title',
	jump: 'text-jump',
	duck: 'text-duck',
	retry: 'text-retry'
}

class Title {
	constructor(type) {
		this.counter = 0
		this.type = type
		this.part = TITLE_PARTS[type]

		if (this.type === 'main') { 
			this.width = 554
			this.height = 70
			this.x = 85
			this.y = 98
		}

		if (this.type === 'jump') { 
			this.width = 594
			this.height = 84
			this.x = 85
			this.y = 60
		}

		if (this.type === 'duck') { 
			this.width = 600
			this.height = 113
			this.x = 85
			this.y = 60
		}

		if (this.type === 'retry') { 
			this.width = 446
			this.height = 112
			this.x = 85
			this.y = 60
		}

	}

	render(context) {
		if (Q.debug) {
			context.fillStyle = 'rgba(255,0,0,0.1)'
			context.fillRect(this.x, this.y, this.width, this.height)
		}

		
		Q.skin.draw(context, this.part, 0, this.x, this.y, this.width, this.height)
	}
}

export default Title