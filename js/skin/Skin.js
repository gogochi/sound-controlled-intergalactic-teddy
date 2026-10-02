// 遊戲物件透過 Q.skin 取得圖片與碰撞遮罩，不需要知道圖片來自哪個檔案
import { pickFrame } from './pixels.js'
import { findPart } from './manifest.js'

class Skin {
	constructor(parts, problems) {
		this.parts = parts
		this.problems = problems
	}

	frame(name, index = 0) {
		const part = this.parts[name]
		return part ? pickFrame(part.frames, index) : null
	}

	frameCount(name) {
		const part = findPart(name)
		return part ? part.frames : 0
	}

	mask(name) {
		const part = this.parts[name]
		return part && part.mask ? part.mask : null
	}

	isCustom(name) {
		const part = this.parts[name]
		return Boolean(part && part.isCustom)
	}

	imageUrl(name) {
		const frame = this.frame(name)
		return frame ? frame.toDataURL() : ''
	}

	// flipped：背景每隔一張左右鏡像，自訂背景就不用處理接縫
	draw(context, name, index, x, y, width, height, flipped = false) {
		const frame = this.frame(name, index)
		if (!frame) {
			return
		}
		if (flipped && this.isCustom(name)) {
			context.save()
			context.translate(x + width, y)
			context.scale(-1, 1)
			context.drawImage(frame, 0, 0, width, height)
			context.restore()
		} else {
			context.drawImage(frame, x, y, width, height)
		}
	}
}

export default Skin
