const tool = document.querySelector(".upload-box");

if (tool) {
  const imageInput = tool.querySelector(".imageInput");
  const chooseButton = tool.querySelector(".chooseButton");
  const applyButton = tool.querySelector(".applyButton");
  const downloadButton = tool.querySelector(".downloadButton");
  const previewImage = tool.querySelector(".previewImage");
  const resultCanvas = tool.querySelector(".resultCanvas");
  const filterName = tool.dataset.filter;

  let currentImage = null;
  const ctx = resultCanvas.getContext("2d", { willReadFrequently: true });

  chooseButton.addEventListener("click", () => imageInput.click());

  imageInput.addEventListener("change", (event) => {
    const [file] = event.target.files;
    if (!file) {
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    currentImage = new Image();
    currentImage.onload = () => {
      const width = currentImage.naturalWidth || currentImage.width;
      const height = currentImage.naturalHeight || currentImage.height;

      previewImage.src = objectUrl;
      previewImage.hidden = false;
      resultCanvas.width = width;
      resultCanvas.height = height;
      ctx.clearRect(0, 0, width, height);

      applyButton.hidden = false;
      downloadButton.hidden = true;
      resultCanvas.hidden = true;
    };
    currentImage.src = objectUrl;
  });

  applyButton.addEventListener("click", () => {
    if (!currentImage) {
      return;
    }

    const width = currentImage.naturalWidth || currentImage.width;
    const height = currentImage.naturalHeight || currentImage.height;
    resultCanvas.width = width;
    resultCanvas.height = height;

    if (filterName === "blur") {
      ctx.clearRect(0, 0, width, height);
      ctx.filter = "blur(6px)";
      ctx.drawImage(currentImage, 0, 0, width, height);
      ctx.filter = "none";
      resultCanvas.hidden = false;
      downloadButton.href = resultCanvas.toDataURL("image/png");
      downloadButton.hidden = false;
      return;
    }

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(currentImage, 0, 0, width, height);

    const source = ctx.getImageData(0, 0, width, height);
    const output = runFilter(source, width, height, filterName);
    ctx.putImageData(output, 0, 0);

    resultCanvas.hidden = false;
    downloadButton.href = resultCanvas.toDataURL("image/png");
    downloadButton.hidden = false;
  });
}

function runFilter(imageData, width, height, filterName) {
  switch (filterName) {
    case "blur":
      return convolve(imageData, width, height, [
        1 / 9, 1 / 9, 1 / 9,
        1 / 9, 1 / 9, 1 / 9,
        1 / 9, 1 / 9, 1 / 9
      ]);
    case "brightness":
      return adjustBrightness(imageData, 70);
    case "contrast":
      return adjustContrast(imageData, 40);
    case "sharpen":
      return convolve(imageData, width, height, [
         0, -1,  0,
        -1,  7, -1,
         0, -1,  0
      ]);
    case "denoise":
      return medianFilter(imageData, width, height);
    default:
      return imageData;
  }
}

function adjustBrightness(imageData, amount) {
  const data = new Uint8ClampedArray(imageData.data);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(data[i] + amount);
    data[i + 1] = clamp(data[i + 1] + amount);
    data[i + 2] = clamp(data[i + 2] + amount);
  }
  return new ImageData(data, imageData.width, imageData.height);
}

function adjustContrast(imageData, amount) {
  const data = new Uint8ClampedArray(imageData.data);
  const factor = (259 * (amount + 255)) / (255 * (259 - amount));
  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(factor * (data[i] - 128) + 128);
    data[i + 1] = clamp(factor * (data[i + 1] - 128) + 128);
    data[i + 2] = clamp(factor * (data[i + 2] - 128) + 128);
  }
  return new ImageData(data, imageData.width, imageData.height);
}

function convolve(imageData, width, height, kernel) {
  const source = imageData.data;
  const output = new Uint8ClampedArray(source.length);
  const size = Math.sqrt(kernel.length);
  const offset = Math.floor(size / 2);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let red = 0;
      let green = 0;
      let blue = 0;
      const alphaIndex = (y * width + x) * 4 + 3;

      for (let ky = 0; ky < size; ky += 1) {
        for (let kx = 0; kx < size; kx += 1) {
          const px = clampCoordinate(x + kx - offset, width - 1);
          const py = clampCoordinate(y + ky - offset, height - 1);
          const srcIndex = (py * width + px) * 4;
          const weight = kernel[ky * size + kx];
          red += source[srcIndex] * weight;
          green += source[srcIndex + 1] * weight;
          blue += source[srcIndex + 2] * weight;
        }
      }

      const dstIndex = (y * width + x) * 4;
      output[dstIndex] = clamp(red);
      output[dstIndex + 1] = clamp(green);
      output[dstIndex + 2] = clamp(blue);
      output[dstIndex + 3] = source[alphaIndex];
    }
  }

  return new ImageData(output, width, height);
}

function medianFilter(imageData, width, height) {
  const source = imageData.data;
  const output = new Uint8ClampedArray(source.length);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const reds = [];
      const greens = [];
      const blues = [];

      for (let ky = -1; ky <= 1; ky += 1) {
        for (let kx = -1; kx <= 1; kx += 1) {
          const px = clampCoordinate(x + kx, width - 1);
          const py = clampCoordinate(y + ky, height - 1);
          const index = (py * width + px) * 4;
          reds.push(source[index]);
          greens.push(source[index + 1]);
          blues.push(source[index + 2]);
        }
      }

      reds.sort((a, b) => a - b);
      greens.sort((a, b) => a - b);
      blues.sort((a, b) => a - b);

      const dstIndex = (y * width + x) * 4;
      output[dstIndex] = reds[4];
      output[dstIndex + 1] = greens[4];
      output[dstIndex + 2] = blues[4];
      output[dstIndex + 3] = source[dstIndex + 3];
    }
  }

  return new ImageData(output, width, height);
}

function clamp(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function clampCoordinate(value, max) {
  return Math.max(0, Math.min(max, value));
}
