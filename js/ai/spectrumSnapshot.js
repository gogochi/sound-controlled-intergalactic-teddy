// 把訓練畫面的頻譜存成 PNG：canvas 本身是透明背景，存檔時補上白底，跟畫面上看到的一樣
const BACKGROUND = "#ffffff";
const REVOKE_DELAY_MS = 1000;

function pad(value) {
  return String(value).padStart(2, "0");
}

export function snapshotFileName(date) {
  const day = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  return `spectrum-${day}-${time}.png`;
}

// 只認單獨的 S：不攔 Ctrl+S 等瀏覽器快速鍵，按住不放也只存一張
export function isSnapshotKey(event) {
  return (
    (event.key === "s" || event.key === "S") &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey &&
    !event.repeat
  );
}

export function saveCanvasSnapshot(canvas, fileName) {
  return new Promise((resolve, reject) => {
    const snapshot = document.createElement("canvas");
    snapshot.width = canvas.width;
    snapshot.height = canvas.height;
    const context = snapshot.getContext("2d");
    context.fillStyle = BACKGROUND;
    context.fillRect(0, 0, snapshot.width, snapshot.height);
    context.drawImage(canvas, 0, 0);

    snapshot.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Could not create the spectrum image"));
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
      resolve(fileName);
    }, "image/png");
  });
}
