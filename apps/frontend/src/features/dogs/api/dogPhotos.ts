export type DogPhoto = {
  file: File;
  position: { x: number; y: number };
  zoom: number;
};

export function dogPhotoCrop(image: HTMLImageElement, photo: DogPhoto) {
  const size = Math.min(image.naturalWidth, image.naturalHeight) / photo.zoom;
  return {
    size,
    left: (image.naturalWidth - size) * photo.position.x,
    top: (image.naturalHeight - size) * photo.position.y,
  };
}

/** Both the editor and upload draw exactly the same source rectangle. */
export function drawDogPhoto(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  photo: DogPhoto,
  outputSize: number,
) {
  const { size, left, top } = dogPhotoCrop(image, photo);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, left, top, size, size, 0, 0, outputSize, outputSize);
}

/** Export the canvas crop before sending the avatar to the backend. */
export async function photoFormData(photo: DogPhoto) {
  const url = URL.createObjectURL(photo.file);
  let blob: Blob;
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (!image.naturalWidth || !image.naturalHeight) {
      throw new Error("Unable to read the photo");
    }

    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable");
    drawDogPhoto(context, image, photo, 128);
    blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) =>
          result
            ? resolve(result)
            : reject(new Error("Unable to encode the avatar")),
        "image/webp",
        0.8,
      );
    });
    if (blob.size > 100 * 1024) {
      throw new Error("Avatar must be at most 100 KB");
    }
  } finally {
    URL.revokeObjectURL(url);
  }
  const body = new FormData();
  body.set(
    "file",
    blob,
    `avatar.${blob.type === "image/webp" ? "webp" : "png"}`,
  );
  return body;
}
