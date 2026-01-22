/**
 * Utilitários para processamento de imagens
 * - Conversão para WebP
 * - Adição de marca d'água
 */

export interface ProcessedImage {
  originalBlob: Blob;      // Imagem original em WebP (sem marca d'água) - para download final
  watermarkedBlob: Blob;   // Imagem com marca d'água em WebP - para visualização do cliente
  width: number;
  height: number;
}

export interface WatermarkOptions {
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  opacity?: number;
  position?: 'center' | 'bottom-right' | 'bottom-left' | 'diagonal';
  logoUrl?: string;
}

const defaultWatermarkOptions: WatermarkOptions = {
  text: 'STORYLENS',
  fontSize: 48,
  fontFamily: 'Arial, sans-serif',
  color: '#ffffff',
  opacity: 0.4,
  position: 'diagonal',
};

/**
 * Carrega uma imagem de um File para um HTMLImageElement
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Converte canvas para Blob em formato WebP
 */
function canvasToBlob(canvas: HTMLCanvasElement, quality: number = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Falha ao converter canvas para blob'));
        }
      },
      'image/webp',
      quality
    );
  });
}

/**
 * Desenha marca d'água em diagonal (padrão repetido)
 */
function drawDiagonalWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: WatermarkOptions
) {
  const { text, fontSize, fontFamily, color, opacity } = { ...defaultWatermarkOptions, ...options };
  
  ctx.save();
  ctx.globalAlpha = opacity || 0.4;
  ctx.fillStyle = color || '#ffffff';
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Rotacionar -30 graus
  const angle = -30 * (Math.PI / 180);
  
  // Calcular o espaçamento entre as marcas d'água
  const textWidth = ctx.measureText(text || 'STORYLENS').width;
  const spacing = textWidth * 1.8;
  const verticalSpacing = (fontSize || 48) * 3;
  
  // Desenhar múltiplas marcas d'água em diagonal
  const diagonal = Math.sqrt(width * width + height * height);
  
  for (let y = -diagonal; y < diagonal * 2; y += verticalSpacing) {
    for (let x = -diagonal; x < diagonal * 2; x += spacing) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillText(text || 'STORYLENS', 0, 0);
      ctx.restore();
    }
  }
  
  ctx.restore();
}

/**
 * Desenha marca d'água centralizada
 */
function drawCenterWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: WatermarkOptions
) {
  const { text, fontSize, fontFamily, color, opacity } = { ...defaultWatermarkOptions, ...options };
  
  ctx.save();
  ctx.globalAlpha = opacity || 0.4;
  ctx.fillStyle = color || '#ffffff';
  ctx.font = `bold ${(fontSize || 48) * 2}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Desenhar sombra para melhor visibilidade
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  
  ctx.fillText(text || 'STORYLENS', width / 2, height / 2);
  ctx.restore();
}

/**
 * Desenha marca d'água no canto inferior direito
 */
function drawCornerWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: WatermarkOptions,
  position: 'bottom-right' | 'bottom-left'
) {
  const { text, fontSize, fontFamily, color, opacity } = { ...defaultWatermarkOptions, ...options };
  
  ctx.save();
  ctx.globalAlpha = opacity || 0.6;
  ctx.fillStyle = color || '#ffffff';
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.textBaseline = 'bottom';
  
  // Sombra
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  
  const padding = 20;
  
  if (position === 'bottom-right') {
    ctx.textAlign = 'right';
    ctx.fillText(text || 'STORYLENS', width - padding, height - padding);
  } else {
    ctx.textAlign = 'left';
    ctx.fillText(text || 'STORYLENS', padding, height - padding);
  }
  
  ctx.restore();
}

/**
 * Processa uma imagem: converte para WebP e adiciona marca d'água
 */
export async function processImage(
  file: File,
  watermarkOptions?: WatermarkOptions,
  quality: number = 0.85
): Promise<ProcessedImage> {
  // Carregar imagem
  const img = await loadImage(file);
  const { width, height } = img;
  
  // Criar canvas para imagem original (sem marca d'água)
  const originalCanvas = document.createElement('canvas');
  originalCanvas.width = width;
  originalCanvas.height = height;
  const originalCtx = originalCanvas.getContext('2d')!;
  originalCtx.drawImage(img, 0, 0);
  
  // Criar canvas para imagem com marca d'água
  const watermarkedCanvas = document.createElement('canvas');
  watermarkedCanvas.width = width;
  watermarkedCanvas.height = height;
  const watermarkedCtx = watermarkedCanvas.getContext('2d')!;
  watermarkedCtx.drawImage(img, 0, 0);
  
  // Aplicar marca d'água
  const options = { ...defaultWatermarkOptions, ...watermarkOptions };
  
  // Ajustar tamanho da fonte baseado no tamanho da imagem
  const baseFontSize = Math.min(width, height) / 20;
  options.fontSize = Math.max(24, Math.min(baseFontSize, 72));
  
  switch (options.position) {
    case 'center':
      drawCenterWatermark(watermarkedCtx, width, height, options);
      break;
    case 'bottom-right':
    case 'bottom-left':
      drawCornerWatermark(watermarkedCtx, width, height, options, options.position);
      break;
    case 'diagonal':
    default:
      drawDiagonalWatermark(watermarkedCtx, width, height, options);
      break;
  }
  
  // Converter para WebP
  const [originalBlob, watermarkedBlob] = await Promise.all([
    canvasToBlob(originalCanvas, quality),
    canvasToBlob(watermarkedCanvas, quality),
  ]);
  
  // Limpar
  URL.revokeObjectURL(img.src);
  
  return {
    originalBlob,
    watermarkedBlob,
    width,
    height,
  };
}

/**
 * Processa múltiplas imagens em paralelo
 */
export async function processImages(
  files: File[],
  watermarkOptions?: WatermarkOptions,
  quality: number = 0.85,
  onProgress?: (current: number, total: number) => void
): Promise<ProcessedImage[]> {
  const results: ProcessedImage[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const result = await processImage(files[i], watermarkOptions, quality);
    results.push(result);
    onProgress?.(i + 1, files.length);
  }
  
  return results;
}

/**
 * Verifica se o navegador suporta WebP
 */
export function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const webpData = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
    const img = new Image();
    img.onload = () => resolve(img.width === 1);
    img.onerror = () => resolve(false);
    img.src = webpData;
  });
}

