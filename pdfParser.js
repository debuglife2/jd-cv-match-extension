/**
 * PDF Parser using locally bundled pdf.js library
 */

import * as pdfjsLib from 'pdfjs-dist';

// Use local bundled worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('pdf.worker.mjs');

/**
 * Extract text from PDF file
 * @param {File} file - PDF file object
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractTextFromPDF(file) {
    console.log('Starting PDF extraction...');
    try {
        // Convert file to ArrayBuffer
        console.log('Converting file to ArrayBuffer...');
        const arrayBuffer = await file.arrayBuffer();
        console.log(`ArrayBuffer size: ${arrayBuffer.byteLength} bytes`);

        // Load PDF document
        console.log('Loading PDF document...');
        const loadingTask = pdfjsLib.getDocument({
            data: arrayBuffer,
        });
        const pdf = await loadingTask.promise;

        console.log(`PDF loaded: ${pdf.numPages} pages`);

        // Extract text from all pages
        let fullText = '';

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            console.log(`Processing page ${pageNum}/${pdf.numPages}...`);
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();

            // Combine text items
            const pageText = textContent.items
                .map(item => item.str)
                .join(' ');

            fullText += pageText + '\n\n';
        }

        // Clean up text
        fullText = cleanText(fullText);

        console.log(`Extracted ${fullText.length} characters from PDF`);

        return fullText;
    } catch (error) {
        console.error('Error parsing PDF:', error);
        throw new Error(`Failed to parse PDF: ${error.message}`);
    }
}

/**
 * Clean extracted text
 * @param {string} text - Raw extracted text
 * @returns {string} - Cleaned text
 */
function cleanText(text) {
    return text
        // Remove excessive whitespace
        .replace(/\s+/g, ' ')
        // Remove excessive newlines
        .replace(/\n{3,}/g, '\n\n')
        // Trim
        .trim();
}

/**
 * Cache parsed PDF data
 * @param {string} fileName - Name of the PDF file
 * @param {string} text - Extracted text
 */
export async function cacheParsedPDF(fileName, text) {
    const cacheData = {
        fileName,
        text,
        parsedAt: Date.now(),
        fileSize: text.length
    };

    await chrome.storage.local.set({
        pdfCache: cacheData,
        cvText: text // Also save as CV text
    });

    console.log('PDF cached:', {
        fileName,
        size: text.length,
        timestamp: new Date(cacheData.parsedAt).toLocaleString()
    });
}

/**
 * Get cached PDF data
 * @returns {Promise<object|null>} - Cached data or null
 */
export async function getCachedPDF() {
    const result = await chrome.storage.local.get('pdfCache');
    return result.pdfCache || null;
}

/**
 * Clear PDF cache
 */
export async function clearPDFCache() {
    await chrome.storage.local.remove('pdfCache');
    console.log('PDF cache cleared');
}
