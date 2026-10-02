import TweenMax from 'gsap'
import Q from './../main'

class Icon {
	constructor(type) {
		this.counter = 0
		this.type = type
		this.part = type === 'clap' ? 'hint-clap' : 'hint-say'

		this.canChange = true

		if (type === 'clap') {
			this.width = 144
			this.height = 204
			this.x = 250
			this.y = 200

			this.frame = 0
			this.numFrames = 2
			this.speed = 10
			
		}

		if (type === 'say') {
			this.width = 155
			this.height = 148
			this.x = 250
			this.y = 250

			this.frame = 0
			this.numFrames = 2
			this.speed = 10
		}
	}

	render(context) {
		if (Q.debug) {
			context.fillStyle = 'rgba(255,0,0,0.1)'
			context.fillRect(this.x, this.y, this.width, this.height)
		}

		
		Q.skin.draw(context, this.part, this.frame, this.x, this.y, this.width, this.height)

		if (this.canChange) {
			if (this.counter < this.speed) {
				this.counter += 1
			}else {
				this.counter = 0

				if (this.frame < this.numFrames) {
					this.frame += 1
				}else {
					this.frame = 0
					if (this.triggered && this.type === 'clap') {
						this.canChange = false
						this.timer = setTimeout(() => {
							this.canChange = true
							this.triggered = false
						}, 1800)
					}

					if (this.triggered && this.type === 'say') {
						this.canChange = false
						this.timer = setTimeout(() => {
							this.canChange = true
							this.triggered = false
						}, 2200)
					}
				}

				if (this.type === 'clap' && this.frame === 2) {
					Q.player.duck()
					if (Q.clapSound) {
						Q.clapSound.play()
					}
					this.triggered = true
				}

				if (this.type === 'say' && this.frame === 2) {
					Q.player.jump()
					if (Q.ohSound) {
						Q.ohSound.play()
					}
					this.triggered = true
				}

			}
		}
	}
}

export default Icon