/**
 * Service for sending PDF content to the server for AI analysis
 */

/**
 * Helper function to chunk large files for transmission
 */
function chunkArrayBuffer(arrayBuffer: ArrayBuffer, chunkSize: number = 500 * 1024): ArrayBuffer[] {
  const chunks: ArrayBuffer[] = [];
  const bytesTotal = arrayBuffer.byteLength;
  
  for (let offset = 0; offset < bytesTotal; offset += chunkSize) {
    const sliceSize = Math.min(chunkSize, bytesTotal - offset);
    const chunk = arrayBuffer.slice(offset, offset + sliceSize);
    chunks.push(chunk);
  }
  
  return chunks;
}

/**
 * Convert an ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Send PDF content for AI-powered analysis, with support for both file and text-based analysis
 * 
 * @param pdfText The extracted text content from the PDF
 * @param fileName Name of the PDF file
 * @param fileSize Size of the PDF in bytes
 * @param pageCount Number of pages in the PDF
 * @param pdfFile The actual PDF file object (optional)
 * @returns The analysis result from the server
 */
export async function analyzePdfContent(
  pdfText: string, 
  fileName?: string, 
  fileSize?: number, 
  pageCount?: number,
  pdfFile?: File | Blob
): Promise<{
  success: boolean;
  analysis?: string;
  documentInfo?: any;
  message?: string;
}> {
  try {
    // First try sending just the text content, which works better for large documents
    console.log("Analyzing PDF using extracted text...");
    
    // Make the request to our server endpoint
    const response = await fetch('/api/pdf-analyzer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: pdfText,
        fileName: fileName || 'document.pdf',
        fileSize: fileSize || 0,
        pageCount: pageCount || 0
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const result = await response.json();
    
    // If text analysis worked well, return the result
    if (result.success && result.analysis) {
      return result;
    } else {
      console.warn("Text-based analysis was not successful, falling back to basic document info");
      return result;
    }
  } catch (error) {
    console.error('Error analyzing PDF content:', error);
    return {
      success: false,
      message: `Failed to analyze PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export default {
  analyzePdfContent
};