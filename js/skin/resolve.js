// 決定每個部位要用自訂圖還是原版圖：自訂圖至少有一張讀得到就用自訂，否則用原版

export function originalUrls(part, dir) {
	if (part.frames === 1) {
		return [`${dir}/${part.name}.png`]
	}
	const urls = []
	for (let frame = 1; frame <= part.frames; frame += 1) {
		urls.push(`${dir}/${part.name}-${frame}.png`)
	}
	return urls
}

export function customUrls(files, dir) {
	return files.map((file) => `${dir}/${encodeURIComponent(file)}`)
}

function loadOptional(url, loadImage) {
	return loadImage(url).then(
		(image) => ({ url, image }),
		() => ({ url, image: null })
	)
}

export function resolvePartImages(custom, originals, loadImage) {
	return Promise.all(custom.map((url) => loadOptional(url, loadImage))).then((results) => {
		const images = results.filter((result) => result.image).map((result) => result.image)
		const failed = results.filter((result) => !result.image).map((result) => result.url)
		if (images.length > 0) {
			return { images, isCustom: true, failed }
		}
		return Promise.all(originals.map(loadImage)).then((loaded) => ({ images: loaded, isCustom: false, failed }))
	})
}
