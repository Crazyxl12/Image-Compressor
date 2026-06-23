const imageInput = document.querySelector("#imageInput");
const dropzone = document.querySelector("#dropzone");
const compressionInput = document.querySelector("#compressionLevel");
const compressionValue = document.querySelector("#compressionValue");
const formatInput = document.querySelector("#format");
const formatShortcutButtons = document.querySelectorAll("[data-format-option]");
const compressButton = document.querySelector("#compressButton");
const downloadLink = document.querySelector("#downloadLink");
const downloadZipLink = document.querySelector("#downloadZipLink");
const statusText = document.querySelector("#status");
const selectedFilesBox = document.querySelector("#selectedFilesBox");
const selectedCount = document.querySelector("#selectedCount");
const selectedFilesList = document.querySelector("#selectedFilesList");
const clearSelectionButton = document.querySelector("#clearSelectionButton");

const previewSection = document.querySelector("#previewSection");
const originalPreview = document.querySelector("#originalPreview");
const compressedPreview = document.querySelector("#compressedPreview");
const originalName = document.querySelector("#originalName");
const originalSize = document.querySelector("#originalSize");
const originalDimensions = document.querySelector("#originalDimensions");
const compressedSize = document.querySelector("#compressedSize");
const compressedDimensions = document.querySelector("#compressedDimensions");
const compressedFormat = document.querySelector("#compressedFormat");
const difference = document.querySelector("#difference");
const batchResults = document.querySelector("#batchResults");
const resultsSummary = document.querySelector("#resultsSummary");
const resultsList = document.querySelector("#resultsList");
const summaryOriginalSize = document.querySelector("#summaryOriginalSize");
const summaryCompressedSize = document.querySelector("#summaryCompressedSize");
const summarySavings = document.querySelector("#summarySavings");
const imageModal = document.querySelector("#imageModal");
const modalImage = document.querySelector("#modalImage");
const closeModalButton = document.querySelector("#closeModal");
const loadingScreen = document.querySelector("#loadingScreen");
const loadingFill = document.querySelector("#loadingFill");
const loadingThumb = document.querySelector("#loadingThumb");
const loadingPercent = document.querySelector("#loadingPercent");
const loadingTitle = document.querySelector("#loadingTitle");
const loadingMessage = document.querySelector("#loadingMessage");
const legalModal = document.querySelector("#legalModal");
const legalTitle = document.querySelector("#legalTitle");
const legalEyebrow = document.querySelector("#legalEyebrow");
const legalContent = document.querySelector("#legalContent");
const closeLegalModalButton = document.querySelector("#closeLegalModal");
const legalTopicLinks = document.querySelectorAll("[data-legal-topic]");
const siteNavLinks = document.querySelectorAll("[data-nav-link]");

const MAX_FILES = 10;
const MAX_CANVAS_PIXELS = 16000000;
const MAX_CANVAS_SIDE = 8192;
const DEFAULT_FORMAT = "auto";
const LOADING_MAX_FAKE_PROGRESS = 92;
const LOADING_MIN_VISIBLE_MS = 1800;
const MODAL_CONTENT = {
  guide: {
    eyebrow: "Guia rápido",
    title: "Como usar o compressor",
    paragraphs: [
      "Clique em Escolher imagens ou arraste seus arquivos para a área pontilhada.",
      "Ajuste a redução desejada: quanto maior o número, mais forte será a compressão.",
      "Escolha o formato de saída. JPG é ótimo para fotos, WEBP costuma deixar arquivos menores e PNG mantém transparência.",
      "Depois clique em Comprimir imagens e baixe o resultado quando terminar."
    ]
  },
  help: {
    eyebrow: "Ajuda",
    title: "Dicas para melhores resultados",
    paragraphs: [
      "Se a imagem ficar pesada, aumente um pouco a redução e tente usar WEBP.",
      "Se a imagem perder qualidade demais, diminua a redução para preservar mais detalhes.",
      "Para imagens com fundo transparente, prefira PNG ou WEBP.",
      "Tudo acontece no seu navegador, então imagens muito grandes podem demorar um pouco mais dependendo do computador."
    ]
  },
  privacy: {
    eyebrow: "Privacidade local",
    title: "Política de Privacidade",
    paragraphs: [
      "Suas imagens são processadas direto no seu navegador. O Image Compressor não envia seus arquivos para servidores.",
      "As prévias e arquivos comprimidos ficam temporariamente no seu dispositivo enquanto a página está aberta.",
      "Ao recarregar ou fechar a página, a seleção atual é descartada pelo navegador.",
      "Você continua no controle: escolha, comprima, confira o resultado e baixe somente o que quiser salvar."
    ]
  },
  terms: {
    eyebrow: "Uso responsável",
    title: "Termos de Uso",
    paragraphs: [
      "Use a ferramenta apenas com imagens que você tem permissão para editar, converter ou compartilhar.",
      "O resultado pode variar conforme o formato, o nível de redução escolhido e a qualidade da imagem original.",
      "Antes de publicar ou enviar uma imagem comprimida, confira se o visual e o tamanho final ficaram como você precisa.",
      "A ferramenta funciona localmente no navegador e não armazena cópias permanentes dos seus arquivos."
    ]
  }
};

let selectedFiles = [];
let compressedResults = [];
let selectedPreviewUrls = [];
let originalObjectUrl = null;
let zipObjectUrl = null;
let crcTable = null;
let loadingAnimationFrame = null;
let loadingStartedAt = 0;
let loadingProgress = 0;
let loadingTargetProgress = 0;

updateCompressionRange();
updateFormatShortcuts();
updateCompressionSummaryForSelection();

compressionInput.addEventListener("input", () => {
  playCompressionSliderAnimation();
  updateCompressionRange();
  clearOutdatedCompression();
});

compressionInput.addEventListener("pointerdown", playCompressionSliderAnimation);
compressionInput.addEventListener("pointerup", stopCompressionSliderAnimation);
compressionInput.addEventListener("pointercancel", stopCompressionSliderAnimation);
compressionInput.addEventListener("blur", stopCompressionSliderAnimation);

siteNavLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const modalTopic = link.dataset.modalTopic;
    const scrollTarget = link.dataset.scrollTarget;

    if (modalTopic) {
      event.preventDefault();
      openLegalModal(modalTopic);
      setActiveNavLink(link);
      return;
    }

    if (scrollTarget) {
      event.preventDefault();
      document.querySelector(scrollTarget)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    setActiveNavLink(link);
  });
});

formatInput.addEventListener("change", () => {
  updateFormatShortcuts();
  clearOutdatedCompression();
});

formatShortcutButtons.forEach((button) => {
  button.addEventListener("click", () => {
    formatInput.value = button.dataset.formatOption;
    updateFormatShortcuts();
    clearOutdatedCompression();
  });
});

imageInput.addEventListener("change", (event) => {
  loadImageFiles([...event.target.files]);
  event.target.value = "";
});

compressButton.addEventListener("click", compressSelectedImages);
clearSelectionButton.addEventListener("click", clearSelection);
compressedPreview.addEventListener("click", openCompressedPreview);
selectedFilesList.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) {
    return;
  }

  const removeButton = event.target.closest("[data-remove-index]");

  if (removeButton) {
    removeSelectedImage(Number(removeButton.dataset.removeIndex));
    return;
  }

  const selectedItem = event.target.closest("[data-selected-preview-url]");

  if (selectedItem) {
    openImageModal(selectedItem.dataset.selectedPreviewUrl);
  }
});
resultsList.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) {
    return;
  }

  const previewButton = event.target.closest("[data-preview-url]");

  if (previewButton) {
    openImageModal(previewButton.dataset.previewUrl);
  }
});
closeModalButton.addEventListener("click", closeImageModal);
imageModal.addEventListener("click", (event) => {
  if (event.target === imageModal) {
    closeImageModal();
  }
});
legalTopicLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    openLegalModal(link.dataset.legalTopic);
  });
});
closeLegalModalButton.addEventListener("click", closeLegalModal);
legalModal.addEventListener("click", (event) => {
  if (event.target === legalModal) {
    closeLegalModal();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !imageModal.hidden) {
    closeImageModal();
  }

  if (event.key === "Escape" && !legalModal.hidden) {
    closeLegalModal();
  }
});

["dragenter", "dragover"].forEach((eventName) => {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropzone.classList.add("dragover");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropzone.classList.remove("dragover");
  });
});

dropzone.addEventListener("drop", (event) => {
  loadImageFiles([...event.dataTransfer.files]);
});

function loadImageFiles(files) {
  const imageFiles = files.filter(isSupportedImageFile);
  const unsupportedCount = files.length - imageFiles.length;

  if (!imageFiles.length) {
    setStatus("Escolha pelo menos uma imagem JPG, PNG ou WEBP.", true);
    return;
  }

  const mergedFiles = mergeSelectedFiles(selectedFiles, imageFiles);
  const ignoredCount = Math.max(0, mergedFiles.length - MAX_FILES);
  selectedFiles = mergedFiles.slice(0, MAX_FILES);
  clearCompressedOutput();
  updateSelectedFilesView();
  revokeUrl(originalObjectUrl);
  originalObjectUrl = URL.createObjectURL(selectedFiles[0]);

  previewSection.hidden = selectedFiles.length > 1;
  originalPreview.src = originalObjectUrl;
  originalPreview.classList.add("has-image");
  originalName.textContent = buildSelectedName(selectedFiles);
  originalSize.textContent = formatBytes(totalBytes(selectedFiles));
  compressButton.disabled = false;
  compressButton.textContent = selectedFiles.length === 1 ? "Comprimir imagem" : `Comprimir ${selectedFiles.length} imagens`;

  const plural = selectedFiles.length === 1 ? "imagem selecionada" : "imagens selecionadas";
  const limitMessage = ignoredCount ? ` Limite de ${MAX_FILES}; ${ignoredCount} ficou de fora.` : "";
  const unsupportedMessage = unsupportedCount
    ? ` ${unsupportedCount} ${unsupportedCount === 1 ? "arquivo incompatível foi ignorado" : "arquivos incompatíveis foram ignorados"}.`
    : "";
  setStatus(
    `${selectedFiles.length} ${plural}. Clique em comprimir.${limitMessage}${unsupportedMessage}`,
    ignoredCount > 0 || unsupportedCount > 0
  );

  getImageDimensions(originalObjectUrl)
    .then(({ width, height }) => {
      originalDimensions.textContent = `${width} x ${height}px`;
    })
    .catch(() => {
      originalDimensions.textContent = "-";
    });
}

function isSupportedImageFile(file) {
  return ["image/jpeg", "image/png", "image/webp"].includes(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name);
}

function mergeSelectedFiles(currentFiles, newFiles) {
  const filesByKey = new Map(currentFiles.map((file) => [getFileKey(file), file]));

  newFiles.forEach((file) => {
    filesByKey.set(getFileKey(file), file);
  });

  return [...filesByKey.values()];
}

function getFileKey(file) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function updateSelectedFilesView() {
  revokeSelectedPreviewUrls();
  selectedFilesBox.hidden = selectedFiles.length === 0;
  selectedCount.textContent =
    selectedFiles.length === 1 ? "1 imagem selecionada" : `${selectedFiles.length} imagens selecionadas`;
  selectedFilesList.replaceChildren(
    ...selectedFiles.map((file, index) => {
      const item = document.createElement("li");
      const removeButton = document.createElement("button");
      const image = document.createElement("img");
      const name = document.createElement("strong");
      const size = document.createElement("span");
      const previewUrl = URL.createObjectURL(file);

      selectedPreviewUrls.push(previewUrl);
      item.className = "selected-image-item";
      item.dataset.selectedPreviewUrl = previewUrl;
      item.title = file.name;
      removeButton.className = "remove-selected-button";
      removeButton.type = "button";
      removeButton.dataset.removeIndex = String(index);
      removeButton.setAttribute("aria-label", `Remover ${file.name}`);
      removeButton.textContent = "×";
      image.src = previewUrl;
      image.alt = file.name;
      name.textContent = file.name;
      size.textContent = formatBytes(file.size);
      item.append(removeButton, image, name, size);
      return item;
    })
  );
}

function revokeSelectedPreviewUrls() {
  selectedPreviewUrls.forEach((url) => revokeUrl(url));
  selectedPreviewUrls = [];
}

function removeSelectedImage(index) {
  if (!Number.isInteger(index) || index < 0 || index >= selectedFiles.length) {
    return;
  }

  selectedFiles.splice(index, 1);

  if (!selectedFiles.length) {
    clearSelection();
    return;
  }

  clearCompressedOutput();
  updateSelectedFilesView();
  updateSelectedPreview();

  const plural = selectedFiles.length === 1 ? "imagem selecionada" : "imagens selecionadas";
  setStatus(`${selectedFiles.length} ${plural}. Clique em comprimir.`, false);
}

function updateSelectedPreview() {
  revokeUrl(originalObjectUrl);
  originalObjectUrl = URL.createObjectURL(selectedFiles[0]);
  previewSection.hidden = selectedFiles.length > 1;
  originalPreview.src = originalObjectUrl;
  originalPreview.classList.add("has-image");
  originalName.textContent = buildSelectedName(selectedFiles);
  originalSize.textContent = formatBytes(totalBytes(selectedFiles));
  originalDimensions.textContent = "-";
  compressButton.disabled = false;
  compressButton.textContent = selectedFiles.length === 1 ? "Comprimir imagem" : `Comprimir ${selectedFiles.length} imagens`;

  getImageDimensions(originalObjectUrl)
    .then(({ width, height }) => {
      originalDimensions.textContent = `${width} x ${height}px`;
    })
    .catch(() => {
      originalDimensions.textContent = "-";
    });
}

function clearSelection() {
  selectedFiles = [];
  clearCompressedOutput();
  formatInput.value = DEFAULT_FORMAT;
  updateFormatShortcuts();
  updateSelectedFilesView();
  revokeUrl(originalObjectUrl);
  originalObjectUrl = null;
  previewSection.hidden = false;
  originalPreview.removeAttribute("src");
  originalPreview.classList.remove("has-image");
  originalName.textContent = "-";
  originalSize.textContent = "-";
  originalDimensions.textContent = "-";
  compressButton.disabled = true;
  compressButton.textContent = "Comprimir imagens";
  setStatus("Nenhuma imagem selecionada.", false);
}

async function compressSelectedImages() {
  if (!selectedFiles.length) {
    return;
  }

  clearCompressedOutput();
  compressButton.disabled = true;
  compressButton.classList.add("loading");

  try {
    const isBatch = selectedFiles.length > 1;
    const totalSteps = selectedFiles.length + (isBatch ? 1 : 0);
    const failedFiles = [];

    previewSection.hidden = isBatch;
    batchResults.hidden = !isBatch;
    showLoadingScreen(selectedFiles.length);
    updateLoadingProgress(
      0,
      totalSteps,
      "Preparando compressão",
      selectedFiles.length === 1 ? "A imagem está sendo preparada." : "As imagens estão sendo preparadas."
    );
    await waitForPaint();

    for (const [index, file] of selectedFiles.entries()) {
      setStatus(`Comprimindo ${index + 1} de ${selectedFiles.length}: ${file.name}`, false);
      updateLoadingProgress(
        index,
        totalSteps,
        `Comprimindo ${index + 1} de ${selectedFiles.length}`,
        file.name
      );

      try {
        const result = await compressImageFile(file);

        compressedResults.push(result);

        if (isBatch) {
          addResultItem(result);
        } else {
          showCompressedResult(result);
        }

        updateLoadingProgress(
          index + 1,
          totalSteps,
          `Imagem ${index + 1} concluída`,
          result.result
        );
      } catch (error) {
        failedFiles.push(file.name);
        updateLoadingProgress(
          index + 1,
          totalSteps,
          `Imagem ${index + 1} pulada`,
          "Não foi possível processar esse arquivo."
        );
      }
    }

    if (!compressedResults.length) {
      throw new Error("Nenhuma imagem pôde ser comprimida.");
    }

    if (isBatch) {
      updateResultsSummary();

      if (compressedResults.length > 1) {
        updateLoadingProgress(
          selectedFiles.length,
          totalSteps,
          "Preparando download",
          "Montando o arquivo com todas as imagens comprimidas."
        );
        await prepareZipDownload();
      }
    }

    await finishLoadingScreen(
      failedFiles.length ? "Compressão parcial" : "Compressão concluída",
      failedFiles.length ? "Algumas imagens foram puladas, mas as outras ficaram prontas." : "Tudo pronto para baixar."
    );

    const plural = compressedResults.length === 1 ? "imagem processada" : "imagens processadas";
    const failedMessage = failedFiles.length
      ? ` ${failedFiles.length} ${failedFiles.length === 1 ? "imagem não pôde ser comprimida" : "imagens não puderam ser comprimidas"}.`
      : "";
    setStatus(`${compressedResults.length} ${plural}.${failedMessage}`, failedFiles.length > 0);
  } catch (error) {
    await finishLoadingScreen("Não foi possível concluir", "Tente novamente com outra imagem ou formato.");
    setStatus("Não foi possível comprimir essa imagem. Tente usar JPG, PNG ou WEBP.", true);
  } finally {
    hideLoadingScreen();
    compressButton.classList.remove("loading");
    compressButton.disabled = false;
  }
}

async function compressImageFile(file) {
  const source = await loadImageSource(file);
  const { width, height } = getSafeCanvasSize(source.width, source.height);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    source.close();
    throw new Error("Canvas indisponível.");
  }

  canvas.width = width;
  canvas.height = height;

  try {
    context.drawImage(source.image, 0, 0, width, height);
  } finally {
    source.close();
  }

  const targetBytes = calculateTargetBytes(file.size);
  const candidates = await buildCompressionCandidates(canvas, file, targetBytes);
  const bestCandidate = chooseBestCandidate(candidates, file.size, targetBytes);
  const blob = bestCandidate ? bestCandidate.blob : file;
  const url = URL.createObjectURL(blob);

  return {
    blob,
    url,
    originalName: file.name,
    downloadName: bestCandidate ? buildFileName(file.name, bestCandidate.format) : file.name,
    originalBytes: file.size,
    finalBytes: blob.size,
    dimensions: `${width} x ${height}px`,
    format: bestCandidate ? formatLabel(bestCandidate.format, bestCandidate.level, bestCandidate.quality) : "Original",
    result: bestCandidate ? calculateDifference(file.size, blob.size) : "Original mantida",
  };
}

async function loadImageSource(file) {
  if ("createImageBitmap" in window) {
    try {
      const image = await createImageBitmap(file);

      return {
        image,
        width: image.width,
        height: image.height,
        close() {
          if (typeof image.close === "function") {
            image.close();
          }
        }
      };
    } catch (error) {
      // Alguns navegadores mobile falham aqui com fotos vindas da galeria.
    }
  }

  const url = URL.createObjectURL(file);

  try {
    const image = await loadImageElement(url);

    return {
      image,
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
      close() {
        revokeUrl(url);
      }
    };
  } catch (error) {
    revokeUrl(url);
    throw new Error("Formato de imagem não suportado.");
  }
}

function loadImageElement(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Falha ao carregar imagem."));
    image.decoding = "async";
    image.src = url;
  });
}

function getSafeCanvasSize(width, height) {
  if (!width || !height) {
    throw new Error("Dimensões inválidas.");
  }

  const sideScale = Math.min(1, MAX_CANVAS_SIDE / width, MAX_CANVAS_SIDE / height);
  const pixelScale = Math.min(1, Math.sqrt(MAX_CANVAS_PIXELS / (width * height)));
  const scale = Math.min(sideScale, pixelScale);

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale))
  };
}

function showCompressedResult(result) {
  compressedPreview.src = result.url;
  compressedPreview.classList.add("has-image");
  compressedSize.textContent = formatBytes(result.finalBytes);
  compressedFormat.textContent = result.format;
  compressedDimensions.textContent = result.dimensions;
  difference.textContent = result.result;
  updateCompressionSummary(result.originalBytes, result.finalBytes);

  downloadLink.href = result.url;
  downloadLink.download = result.downloadName;
  downloadLink.classList.remove("disabled");
}

function addResultItem(result) {
  const item = document.createElement("article");
  const previewButton = document.createElement("button");
  const thumbnail = document.createElement("img");
  const info = document.createElement("div");
  const title = document.createElement("strong");
  const sizes = document.createElement("span");
  const resultText = document.createElement("span");
  const download = document.createElement("a");

  item.className = "result-item";
  previewButton.className = "result-thumb";
  previewButton.type = "button";
  previewButton.dataset.previewUrl = result.url;
  previewButton.setAttribute("aria-label", `Abrir prévia de ${result.originalName}`);
  thumbnail.src = result.url;
  thumbnail.alt = "";

  info.className = "result-info";
  title.textContent = result.originalName;
  title.title = result.originalName;
  sizes.textContent = `${formatBytes(result.originalBytes)} -> ${formatBytes(result.finalBytes)} · ${result.format}`;
  resultText.textContent = result.result;

  download.className = "download";
  download.href = result.url;
  download.download = result.downloadName;
  download.textContent = "Baixar";

  previewButton.append(thumbnail);
  info.append(title, sizes, resultText);
  item.append(previewButton, info, download);
  resultsList.append(item);
  batchResults.hidden = false;
}

function updateResultsSummary() {
  const originalTotal = compressedResults.reduce((sum, result) => sum + result.originalBytes, 0);
  const finalTotal = compressedResults.reduce((sum, result) => sum + result.finalBytes, 0);
  const count = compressedResults.length;
  const plural = count === 1 ? "imagem" : "imagens";

  resultsSummary.textContent = `${count} ${plural} · ${formatBytes(originalTotal)} -> ${formatBytes(finalTotal)} · ${calculateDifference(
    originalTotal,
    finalTotal
  )}`;
  updateCompressionSummary(originalTotal, finalTotal);
}

async function prepareZipDownload() {
  revokeUrl(zipObjectUrl);
  zipObjectUrl = null;
  downloadZipLink.removeAttribute("href");
  downloadZipLink.classList.add("disabled");

  if (compressedResults.length < 2) {
    return;
  }

  const zipBlob = await createZipBlob(compressedResults);
  zipObjectUrl = URL.createObjectURL(zipBlob);
  downloadZipLink.href = zipObjectUrl;
  downloadZipLink.download = "imagens-comprimidas.zip";
  downloadZipLink.classList.remove("disabled");
}

function clearCompressedOutput() {
  closeImageModal();
  compressedPreview.removeAttribute("src");
  compressedPreview.classList.remove("has-image");
  compressedSize.textContent = "-";
  compressedFormat.textContent = "-";
  compressedDimensions.textContent = "-";
  difference.textContent = "-";
  downloadLink.removeAttribute("href");
  downloadLink.classList.add("disabled");
  downloadZipLink.removeAttribute("href");
  downloadZipLink.classList.add("disabled");
  resultsList.replaceChildren();
  batchResults.hidden = true;
  resultsSummary.textContent = "-";

  compressedResults.forEach((result) => revokeUrl(result.url));
  compressedResults = [];
  revokeUrl(zipObjectUrl);
  zipObjectUrl = null;
  updateCompressionSummaryForSelection();
}

function clearOutdatedCompression() {
  if (!compressedResults.length) {
    return;
  }

  clearCompressedOutput();
  setStatus("Configuração alterada. Clique em comprimir novamente.", false);
}

function canvasToBlob(canvas, format, quality) {
  return new Promise((resolve, reject) => {
    const useDataUrlFallback = () => {
      try {
        resolve(dataUrlToBlob(canvas.toDataURL(format, quality)));
      } catch (error) {
        reject(error);
      }
    };

    if (typeof canvas.toBlob !== "function") {
      useDataUrlFallback();
      return;
    }

    try {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            useDataUrlFallback();
          }
        },
        format,
        quality
      );
    } catch (error) {
      useDataUrlFallback();
    }
  });
}

function dataUrlToBlob(dataUrl) {
  const [header, data] = dataUrl.split(",");
  const mimeType = header.match(/data:([^;]+)/)?.[1] || "image/png";
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

async function buildCompressionCandidates(canvas, file, targetBytes) {
  const compressionLevel = getCompressionLevel();
  const formats = getCandidateFormats(formatInput.value, file);
  const candidates = [];

  for (const format of formats) {
    try {
      if (format === "image/png") {
        const blob = await canvasToBlob(canvas, format);
        candidates.push({ blob, format, level: compressionLevel, quality: null });
        continue;
      }

      const result = await findBlobClosestToTarget(canvas, format, targetBytes);

      if (result) {
        candidates.push({ blob: result.blob, format, level: compressionLevel, quality: result.quality });
      }
    } catch (error) {
      // Se um formato falhar no celular, tenta o próximo em vez de parar tudo.
    }
  }

  return candidates;
}

function calculateTargetBytes(originalBytes) {
  const compressionLevel = getCompressionLevel();
  return Math.max(1, Math.round(originalBytes * (1 - compressionLevel / 100)));
}

function getCompressionLevel() {
  return Math.max(5, Math.min(95, Number(compressionInput.value) || 50));
}

async function findBlobClosestToTarget(canvas, format, targetBytes) {
  let lowQuality = 0.1;
  let highQuality = 0.95;
  let bestUnderTarget = null;
  let smallestCandidate = null;

  for (let attempt = 0; attempt < 9; attempt++) {
    const quality = Number(((lowQuality + highQuality) / 2).toFixed(3));
    const blob = await canvasToBlob(canvas, format, quality);

    if (blob.type !== format) {
      return null;
    }

    const candidate = { blob, quality };

    if (!smallestCandidate || blob.size < smallestCandidate.blob.size) {
      smallestCandidate = candidate;
    }

    if (blob.size <= targetBytes) {
      if (!bestUnderTarget || blob.size > bestUnderTarget.blob.size) {
        bestUnderTarget = candidate;
      }

      lowQuality = quality;
    } else {
      highQuality = quality;
    }
  }

  return bestUnderTarget || smallestCandidate;
}

function getCandidateFormats(selectedFormat, file) {
  if (selectedFormat !== "auto") {
    return [selectedFormat];
  }

  if (file.type === "image/png" || file.type === "image/webp") {
    return ["image/webp"];
  }

  return ["image/webp", "image/jpeg"];
}

function chooseBestCandidate(candidates, originalBytes, targetBytes) {
  const smallerCandidates = candidates.filter((candidate) => candidate.blob.size < originalBytes);

  if (!smallerCandidates.length) {
    return null;
  }

  const targetCandidates = smallerCandidates.filter((candidate) => candidate.blob.size <= targetBytes);

  if (targetCandidates.length) {
    return targetCandidates.sort((candidateA, candidateB) => candidateB.blob.size - candidateA.blob.size)[0];
  }

  return smallerCandidates.sort((candidateA, candidateB) => candidateA.blob.size - candidateB.blob.size)[0];
}

function getImageDimensions(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = reject;
    image.src = url;
  });
}

function buildSelectedName(files) {
  if (files.length === 1) {
    return files[0].name;
  }

  return `${files[0].name} + ${files.length - 1} ${files.length === 2 ? "imagem" : "imagens"}`;
}

function totalBytes(files) {
  return files.reduce((sum, file) => sum + file.size, 0);
}

function formatBytes(bytes) {
  if (bytes === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const sizeIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / 1024 ** sizeIndex;
  return `${size.toFixed(size >= 10 || sizeIndex === 0 ? 0 : 1)} ${units[sizeIndex]}`;
}

function calculateDifference(originalBytes, compressedBytes) {
  const difference = originalBytes - compressedBytes;
  const percent = (difference / originalBytes) * 100;

  if (percent < 0) {
    return `${Math.abs(percent).toFixed(1)}% maior`;
  }

  return `${percent.toFixed(1)}% menor`;
}

function formatLabel(mimeType, level, quality) {
  const labels = {
    "image/jpeg": "JPG",
    "image/webp": "WEBP",
    "image/png": "PNG",
  };

  if (!quality) {
    return `${labels[mimeType] || "Imagem"} · sem ajuste`;
  }

  return `${labels[mimeType] || "Imagem"} · meta ${level}%`;
}

function buildFileName(fileName, mimeType) {
  const extensionByType = {
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/png": "png",
  };
  const baseName = fileName.replace(/\.[^.]+$/, "");
  return `${baseName}-comprimida.${extensionByType[mimeType] || "jpg"}`;
}

async function createZipBlob(results) {
  const encoder = new TextEncoder();
  const files = [];
  const usedNames = new Map();

  for (const result of results) {
    const bytes = new Uint8Array(await result.blob.arrayBuffer());
    const name = uniqueZipName(result.downloadName, usedNames);
    files.push({ bytes, nameBytes: encoder.encode(name) });
  }

  const localChunks = [];
  const centralChunks = [];
  let offset = 0;

  for (const file of files) {
    const crc = crc32(file.bytes);
    const localHeader = createLocalZipHeader(file, crc);

    localChunks.push(localHeader, file.bytes);
    centralChunks.push(createCentralZipHeader(file, crc, offset));
    offset += localHeader.length + file.bytes.length;
  }

  const centralStart = offset;
  const centralSize = centralChunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const endRecord = createEndZipRecord(files.length, centralSize, centralStart);

  return new Blob([...localChunks, ...centralChunks, endRecord], { type: "application/zip" });
}

function createLocalZipHeader(file, crc) {
  const header = new Uint8Array(30 + file.nameBytes.length);
  const view = new DataView(header.buffer);

  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 0x0800, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, 0, true);
  view.setUint32(14, crc, true);
  view.setUint32(18, file.bytes.length, true);
  view.setUint32(22, file.bytes.length, true);
  view.setUint16(26, file.nameBytes.length, true);
  view.setUint16(28, 0, true);
  header.set(file.nameBytes, 30);

  return header;
}

function createCentralZipHeader(file, crc, offset) {
  const header = new Uint8Array(46 + file.nameBytes.length);
  const view = new DataView(header.buffer);

  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 20, true);
  view.setUint16(8, 0x0800, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, 0, true);
  view.setUint16(14, 0, true);
  view.setUint32(16, crc, true);
  view.setUint32(20, file.bytes.length, true);
  view.setUint32(24, file.bytes.length, true);
  view.setUint16(28, file.nameBytes.length, true);
  view.setUint16(30, 0, true);
  view.setUint16(32, 0, true);
  view.setUint16(34, 0, true);
  view.setUint16(36, 0, true);
  view.setUint32(38, 0, true);
  view.setUint32(42, offset, true);
  header.set(file.nameBytes, 46);

  return header;
}

function createEndZipRecord(fileCount, centralSize, centralStart) {
  const record = new Uint8Array(22);
  const view = new DataView(record.buffer);

  view.setUint32(0, 0x06054b50, true);
  view.setUint16(4, 0, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, fileCount, true);
  view.setUint16(10, fileCount, true);
  view.setUint32(12, centralSize, true);
  view.setUint32(16, centralStart, true);
  view.setUint16(20, 0, true);

  return record;
}

function uniqueZipName(fileName, usedNames) {
  const safeName = fileName.replace(/[\\/:*?"<>|]/g, "-");
  const count = usedNames.get(safeName) || 0;

  usedNames.set(safeName, count + 1);

  if (count === 0) {
    return safeName;
  }

  return safeName.replace(/(\.[^.]+)?$/, `-${count + 1}$1`);
}

function crc32(bytes) {
  const table = getCrcTable();
  let crc = -1;

  for (const byte of bytes) {
    crc = (crc >>> 8) ^ table[(crc ^ byte) & 0xff];
  }

  return (crc ^ -1) >>> 0;
}

function getCrcTable() {
  if (crcTable) {
    return crcTable;
  }

  crcTable = new Uint32Array(256);

  for (let index = 0; index < 256; index++) {
    let value = index;

    for (let bit = 0; bit < 8; bit++) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }

    crcTable[index] = value >>> 0;
  }

  return crcTable;
}

function setStatus(message, isError) {
  statusText.textContent = message;
  statusText.classList.toggle("error", isError);
}

function updateCompressionSummaryForSelection() {
  const originalTotal = totalBytes(selectedFiles);
  const selectedCount = selectedFiles.length;

  if (summaryOriginalSize) {
    summaryOriginalSize.textContent = selectedCount ? formatBytes(originalTotal) : "-";
  }

  if (summaryCompressedSize) {
    summaryCompressedSize.textContent = "-";
  }

  if (summarySavings) {
    summarySavings.textContent = "-%";
  }

}

function updateCompressionSummary(originalBytes, finalBytes) {
  if (summaryOriginalSize) {
    summaryOriginalSize.textContent = formatBytes(originalBytes);
    replayAnimation(summaryOriginalSize, "pop");
  }

  if (summaryCompressedSize) {
    summaryCompressedSize.textContent = formatBytes(finalBytes);
    replayAnimation(summaryCompressedSize, "pop");
  }

  if (summarySavings) {
    summarySavings.textContent = calculateDifference(originalBytes, finalBytes);
    replayAnimation(summarySavings, "pop");
  }
}

function replayAnimation(element, className) {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
}

function updateCompressionRange() {
  const min = Number(compressionInput.min);
  const max = Number(compressionInput.max);
  const value = Number(compressionInput.value);
  const progress = ((value - min) / (max - min)) * 100;

  compressionInput.style.setProperty("--range-progress", `${progress}%`);
  compressionValue.textContent = `${value}%`;

  if (!compressedResults.length) {
    updateCompressionSummaryForSelection();
  }
}

let compressionSliderAnimationTimer = null;

function playCompressionSliderAnimation() {
  const rangeControl = compressionInput.closest(".range-control");

  if (!rangeControl) {
    return;
  }

  rangeControl.classList.add("is-sliding");
  clearTimeout(compressionSliderAnimationTimer);
  compressionSliderAnimationTimer = setTimeout(stopCompressionSliderAnimation, 420);
}

function stopCompressionSliderAnimation() {
  const rangeControl = compressionInput.closest(".range-control");

  if (rangeControl) {
    rangeControl.classList.remove("is-sliding");
  }

  clearTimeout(compressionSliderAnimationTimer);
  compressionSliderAnimationTimer = null;
}

function updateFormatShortcuts() {
  formatShortcutButtons.forEach((button) => {
    const isActive = button.dataset.formatOption === formatInput.value;

    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function showLoadingScreen(imageCount) {
  stopFakeLoading();
  loadingStartedAt = performance.now();
  loadingProgress = 0;
  loadingTargetProgress = 8;
  setLoadingProgress(0);
  loadingScreen.hidden = false;
  document.body.classList.add("loading-open");
  loadingScreen.setAttribute(
    "aria-label",
    imageCount === 1 ? "Compressão de imagem em andamento" : "Compressão de imagens em andamento"
  );
  startFakeLoading();
}

function hideLoadingScreen() {
  stopFakeLoading();
  loadingScreen.hidden = true;
  document.body.classList.remove("loading-open");
}

function updateLoadingProgress(completedSteps, totalSteps, title, message) {
  const safeTotal = Math.max(totalSteps, 1);
  const progress = (completedSteps / safeTotal) * LOADING_MAX_FAKE_PROGRESS;
  const clampedProgress = Math.min(Math.max(progress, 0), LOADING_MAX_FAKE_PROGRESS);

  loadingTargetProgress = Math.max(loadingTargetProgress, clampedProgress);
  loadingTitle.textContent = title;
  loadingMessage.textContent = message;
}

async function finishLoadingScreen(title, message) {
  const remainingTime = Math.max(0, LOADING_MIN_VISIBLE_MS - (performance.now() - loadingStartedAt));

  if (remainingTime > 0) {
    await wait(remainingTime);
  }

  loadingTitle.textContent = title;
  loadingMessage.textContent = message;
  stopFakeLoading();
  await animateLoadingTo(100, 420);
  await wait(260);
}

function startFakeLoading() {
  stopFakeLoading();

  const tick = () => {
    const elapsed = performance.now() - loadingStartedAt;
    loadingTargetProgress = Math.max(loadingTargetProgress, getFakeLoadingTarget(elapsed));

    if (loadingProgress < loadingTargetProgress) {
      const distance = loadingTargetProgress - loadingProgress;
      const step = Math.max(0.18, distance * 0.08);
      setLoadingProgress(Math.min(loadingProgress + step, loadingTargetProgress));
    }

    loadingAnimationFrame = requestAnimationFrame(tick);
  };

  loadingAnimationFrame = requestAnimationFrame(tick);
}

function stopFakeLoading() {
  if (loadingAnimationFrame) {
    cancelAnimationFrame(loadingAnimationFrame);
    loadingAnimationFrame = null;
  }
}

function getFakeLoadingTarget(elapsed) {
  if (elapsed < 300) {
    return 10;
  }

  if (elapsed < 900) {
    return 34;
  }

  if (elapsed < 1500) {
    return 58;
  }

  if (elapsed < 2600) {
    return 78;
  }

  return Math.min(LOADING_MAX_FAKE_PROGRESS, 78 + (elapsed - 2600) / 420);
}

function animateLoadingTo(targetProgress, duration) {
  const startProgress = loadingProgress;
  const startedAt = performance.now();

  return new Promise((resolve) => {
    const tick = () => {
      const elapsed = performance.now() - startedAt;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - (1 - progress) ** 3;

      setLoadingProgress(startProgress + (targetProgress - startProgress) * easedProgress);

      if (progress < 1) {
        requestAnimationFrame(tick);
        return;
      }

      resolve();
    };

    requestAnimationFrame(tick);
  });
}

function setLoadingProgress(progress) {
  loadingProgress = Math.min(Math.max(progress, 0), 100);
  loadingFill.style.width = `${loadingProgress}%`;
  loadingThumb.style.left = `${loadingProgress}%`;
  loadingPercent.textContent = `${Math.round(loadingProgress)}%`;
}

function waitForPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function openCompressedPreview() {
  if (!compressedPreview.classList.contains("has-image") || !compressedPreview.src) {
    return;
  }

  openImageModal(compressedPreview.src);
}

function openImageModal(url) {
  modalImage.src = url;
  imageModal.hidden = false;
  updatePageModalLock();
  closeModalButton.focus();
}

function closeImageModal() {
  imageModal.hidden = true;
  modalImage.removeAttribute("src");
  updatePageModalLock();
}

function openLegalModal(topic) {
  const content = MODAL_CONTENT[topic];

  if (!content) {
    return;
  }

  legalEyebrow.textContent = content.eyebrow;
  legalTitle.textContent = content.title;
  legalContent.replaceChildren(
    ...content.paragraphs.map((paragraph) => {
      const text = document.createElement("p");
      text.textContent = paragraph;
      return text;
    })
  );
  legalModal.hidden = false;
  updatePageModalLock();
  closeLegalModalButton.focus();
}

function closeLegalModal() {
  legalModal.hidden = true;
  updatePageModalLock();
}

function updatePageModalLock() {
  const hasOpenModal = !imageModal.hidden || !legalModal.hidden;
  document.body.classList.toggle("modal-open", hasOpenModal);
}

function setActiveNavLink(activeLink) {
  siteNavLinks.forEach((link) => {
    const isActive = link === activeLink;
    link.classList.toggle("active", isActive);

    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function updateActiveNavByScroll() {
  if (!siteNavLinks.length) {
    return;
  }

  const scrollPosition = window.scrollY + 140;
  let currentLink = siteNavLinks[0];

  siteNavLinks.forEach((link) => {
    const target = document.querySelector(link.hash);

    if (target && target.offsetTop <= scrollPosition) {
      currentLink = link;
    }
  });

  setActiveNavLink(currentLink);
}

function revokeUrl(url) {
  if (url) {
    URL.revokeObjectURL(url);
  }
}
