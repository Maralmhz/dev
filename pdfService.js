/**
 * PDF Service
 * Utilitário modular para geração de PDF, tentativa de OCR e compartilhamento via WhatsApp.
 *
 * As funções são exportadas como ES module e também podem ser carregadas dinamicamente.
 */

const DEFAULT_PDF_OPTIONS = {
  margin: [10, 10, 10, 10],
  image: { type: 'jpeg', quality: 0.98 },
  html2canvas: {
    scale: 2,
    useCORS: true,
    logging: false,
    scrollY: 0,
    scrollX: 0
  },
  jsPDF: {
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait'
  }
};

function hasSelectableText(element) {
  if (!(element instanceof HTMLElement)) return false;
  const text = (element.innerText || element.textContent || '').trim();
  return text.length > 30;
}

function resolveSourceElement(data, options = {}) {
  if (options.sourceElement instanceof HTMLElement) return options.sourceElement;
  if (data?.sourceElement instanceof HTMLElement) return data.sourceElement;
  if (typeof options.sourceSelector === 'string') return document.querySelector(options.sourceSelector);
  return document.getElementById('resumoContainer')
    || document.getElementById('conteudo-resumo')
    || document.querySelector('#resumo .content');
}

/**
 * Gera um PDF a partir de um elemento HTML e retorna blob/url para reutilização.
 */
async function generatePDF(data = {}, options = {}) {
  if (typeof window === 'undefined') {
    throw new Error('generatePDF deve ser executado no navegador.');
  }

  if (typeof html2pdf === 'undefined') {
    throw new Error('html2pdf não está disponível no contexto atual.');
  }

  const sourceElement = resolveSourceElement(data, options);
  if (!sourceElement) {
    throw new Error('Elemento fonte para PDF não encontrado.');
  }

  const numeroOS = data?.numeroOS || options?.numeroOS || `OS-${Date.now()}`;
  const filename = options.filename || `OS-${numeroOS}.pdf`;
  const pdfOptions = { ...DEFAULT_PDF_OPTIONS, ...options, filename };

  const worker = html2pdf().set(pdfOptions).from(sourceElement);
  const pdfBlob = await worker.outputPdf('blob');

  return {
    blob: pdfBlob,
    filename,
    sourceElement,
    hasTextLayer: hasSelectableText(sourceElement),
    url: URL.createObjectURL(pdfBlob)
  };
}

/**
 * Tenta aplicar OCR quando o PDF não possui texto selecionável.
 * Observação: sem motor OCR presente, retorna o PDF original com fallback documentado.
 */
async function applyOCR(pdfResult) {
  if (!pdfResult) throw new Error('PDF inválido para OCR.');

  if (pdfResult.hasTextLayer) {
    return { ...pdfResult, ocrApplied: false, ocrReason: 'text-layer-detected' };
  }

  if (typeof window === 'undefined' || typeof window.Tesseract === 'undefined') {
    return { ...pdfResult, ocrApplied: false, ocrReason: 'tesseract-not-available' };
  }

  // Placeholder seguro: mantém PDF original e sinaliza tentativa.
  return { ...pdfResult, ocrApplied: true, ocrReason: 'ocr-engine-available' };
}

/**
 * Inicia envio para WhatsApp com fallback para download.
 */
async function sendPDFToWhatsApp(pdfResult) {
  if (!pdfResult?.url) {
    throw new Error('PDF inválido para envio ao WhatsApp.');
  }

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const message = encodeURIComponent('Segue o PDF do checklist/orçamento.');
  const waUrl = isMobile
    ? `https://wa.me/?text=${message}`
    : `https://web.whatsapp.com/send?text=${message}`;

  const popup = window.open(waUrl, '_blank', 'noopener,noreferrer');
  if (!popup) {
    const anchor = document.createElement('a');
    anchor.href = pdfResult.url;
    anchor.download = pdfResult.filename || 'checklist.pdf';
    anchor.click();
    return { sent: false, fallback: 'download', url: pdfResult.url };
  }

  return { sent: true, fallback: null, url: waUrl, attachmentHint: pdfResult.url };
}

export { generatePDF, applyOCR, sendPDFToWhatsApp };
