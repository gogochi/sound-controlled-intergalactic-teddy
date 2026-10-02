// 純像素運算：縮放位置、去背、裁切範圍、碰撞遮罩（不依賴瀏覽器，方便測試）

const VISIBLE_ALPHA = 16
const BACKGROUND_TOLERANCE = 40

export function pickFrame(frames, index) {
	if (!frames || frames.length === 0) {
		return null
	}
	const count = frames.length
	return frames[((index % count) + count) % count]
}

export function fitRect(sourceWidth, sourceHeight, boxWidth, boxHeight, fit) {
	if (fit === 'fill' || sourceWidth <= 0 || sourceHeight <= 0) {
		return { x: 0, y: 0, width: boxWidth, height: boxHeight }
	}
	const scale = Math.min(boxWidth / sourceWidth, boxHeight / sourceHeight)
	const width = sourceWidth * scale
	const height = sourceHeight * scale
	const x = (boxWidth - width) / 2
	const y = fit === 'bottom' ? boxHeight - height : (boxHeight - height) / 2
	return { x, y, width, height }
}

export function alphaBounds(pixels, width, height, threshold = VISIBLE_ALPHA) {
	let left = width
	let top = height
	let right = -1
	let bottom = -1
	for (let y = 0; y < height; y += 1) {
		for (let x = 0; x < width; x += 1) {
			if (pixels[(y * width + x) * 4 + 3] >= threshold) {
				left = Math.min(left, x)
				top = Math.min(top, y)
				right = Math.max(right, x)
				bottom = Math.max(bottom, y)
			}
		}
	}
	if (right < 0) {
		return null
	}
	return { x: left, y: top, width: right - left + 1, height: bottom - top + 1 }
}

function unionBounds(list) {
	if (list.length === 0) {
		return null
	}
	const left = Math.min(...list.map((b) => b.x))
	const top = Math.min(...list.map((b) => b.y))
	const right = Math.max(...list.map((b) => b.x + b.width))
	const bottom = Math.max(...list.map((b) => b.y + b.height))
	return { x: left, y: top, width: right - left, height: bottom - top }
}

// 同一組動畫若尺寸一致，用共同的裁切範圍，避免每格位置跳動
export function frameBounds(frames) {
	const whole = (frame) => ({ x: 0, y: 0, width: frame.width, height: frame.height })
	const first = frames[0]
	const sameSize = frames.every((frame) => frame.width === first.width && frame.height === first.height)
	if (!sameSize) {
		return frames.map((frame) => frame.bounds || whole(frame))
	}
	const union = unionBounds(frames.map((frame) => frame.bounds).filter(Boolean))
	return frames.map((frame) => union || whole(frame))
}

function isFullyOpaque(pixels) {
	for (let i = 3; i < pixels.length; i += 4) {
		if (pixels[i] < 255) {
			return false
		}
	}
	return true
}

function isSimilar(pixels, index, color, tolerance) {
	const offset = index * 4
	return Math.abs(pixels[offset] - color[0]) <= tolerance &&
		Math.abs(pixels[offset + 1] - color[1]) <= tolerance &&
		Math.abs(pixels[offset + 2] - color[2]) <= tolerance
}

function topIndexes(width) {
	const indexes = []
	for (let x = 0; x < width; x += 1) {
		indexes.push(x)
	}
	return indexes
}

function borderIndexes(width, height) {
	const indexes = topIndexes(width)
	for (let x = 0; x < width; x += 1) {
		indexes.push((height - 1) * width + x)
	}
	for (let y = 1; y < height - 1; y += 1) {
		indexes.push(y * width, y * width + width - 1)
	}
	return indexes
}

// AI 生成的圖常是純色背景：若角落同色，就從邊緣把相連的背景色變透明
// edges：'all' 從四邊找背景（角色、怪物），'top' 只從上緣找（山的天空）
export function removeBackground(pixels, width, height, edges = 'all', tolerance = BACKGROUND_TOLERANCE) {
	const result = new Uint8ClampedArray(pixels)
	if (!isFullyOpaque(pixels)) {
		return result
	}
	const background = [pixels[0], pixels[1], pixels[2]]
	const corners = edges === 'top' ? [width - 1] : [width - 1, (height - 1) * width, height * width - 1]
	if (!corners.every((index) => isSimilar(pixels, index, background, tolerance))) {
		return result
	}

	const seeds = edges === 'top' ? topIndexes(width) : borderIndexes(width, height)
	const visited = new Uint8Array(width * height)
	const stack = seeds.filter((index) => isSimilar(pixels, index, background, tolerance))
	stack.forEach((index) => {
		visited[index] = 1
	})

	while (stack.length > 0) {
		const index = stack.pop()
		result[index * 4 + 3] = 0
		const x = index % width
		const neighbours = [
			x > 0 ? index - 1 : -1,
			x < width - 1 ? index + 1 : -1,
			index - width,
			index + width
		]
		neighbours.forEach((next) => {
			if (next >= 0 && next < width * height && !visited[next] && isSimilar(pixels, next, background, tolerance)) {
				visited[next] = 1
				stack.push(next)
			}
		})
	}
	return result
}

// 與原本紅色剪影相同的格式：mask[x][y] 為 'x' 代表會撞到
// 半透明的部分（例如飛碟的玻璃罩）也算，才會和原版剪影的範圍一致
export function maskFromPixels(pixelsList, width, height, threshold = VISIBLE_ALPHA) {
	const mask = []
	for (let x = 0; x < width; x += 1) {
		const column = []
		for (let y = 0; y < height; y += 1) {
			const offset = (y * width + x) * 4 + 3
			const solid = pixelsList.some((pixels) => pixels[offset] >= threshold)
			column.push(solid ? 'x' : ' ')
		}
		mask.push(column)
	}
	return mask
}
