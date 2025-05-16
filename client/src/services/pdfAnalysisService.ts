/**
 * Service for sending PDF content to the server for AI analysis
 */

/**
 * Helper function to chunk PDF files for transmission
 * This allows sending larger PDF files by breaking them down
 */
async function createPdfChunks(pdfFile: File | Blob, maxChunkSize: number = 1.5 * 1024 * 1024): Promise<{
  pdfData?: string,
  error?: string
}> {
  try {
    // For small files, we can send them directly
    if (pdfFile.size <= maxChunkSize) {
      console.log("PDF file is small enough to send without chunking");
      const arrayBuffer = await pdfFile.arrayBuffer();
      const base64Data = arrayBufferToBase64(arrayBuffer);
      return { pdfData: base64Data };
    }
    
    // For larger files, we'll need to use the text-based method instead
    // as chunking data reassembly would require server-side session management
    console.log("PDF file is too large for direct transfer, will use text extraction instead");
    return { 
      error: "PDF file exceeds size limit for direct analysis"
    };
  } catch (error) {
    console.error("Error processing PDF for transmission:", error);
    return { 
      error: error instanceof Error ? error.message : "Unknown error processing PDF" 
    };
  }
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
 * Send PDF for AI-powered analysis, with intelligent handling based on file size
 * 
 * @param pdfText The extracted text content from the PDF 
 * @param fileName Name of the PDF file
 * @param fileSize Size of the PDF in bytes
 * @param pageCount Number of pages in the PDF
 * @param pdfFile The actual PDF file object (if available)
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
    let pdfData: string | undefined = undefined;
    
    // If we have the actual PDF file, try to use it for direct analysis
    if (pdfFile) {
      const chunkResult = await createPdfChunks(pdfFile);
      if (chunkResult.pdfData) {
        pdfData = chunkResult.pdfData;
        console.log("Successfully prepared PDF data for direct analysis");
      } else if (chunkResult.error) {
        console.warn("Cannot use direct PDF analysis:", chunkResult.error);
      }
    }
    
    // Make the request to the server endpoint with all available data
    const response = await fetch('/api/pdf-analyzer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Send both PDF data (if available) and extracted text
        // so the server can decide which method to use
        pdfData: pdfData, 
        text: pdfText,
        fileName: fileName || 'document.pdf',
        fileSize: fileSize || 0,
        pageCount: pageCount || 0
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    return await response.json();
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