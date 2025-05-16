/**
 * Service for sending PDF content to the server for AI analysis
 */

/**
 * Send extracted text for AI-powered analysis
 * 
 * @param pdfText The extracted text content from the PDF
 * @param fileName Name of the PDF file
 * @param fileSize Size of the PDF in bytes
 * @param pageCount Number of pages in the PDF
 * @returns The analysis result from the server
 */
export async function analyzePdfContent(
  pdfText: string, 
  fileName?: string, 
  fileSize?: number, 
  pageCount?: number,
  _pdfFile?: File | Blob // We're not using this directly anymore due to size limitations
): Promise<{
  success: boolean;
  analysis?: string;
  documentInfo?: any;
  message?: string;
}> {
  try {
    // Note: We're not sending the PDF directly because of payload size limitations
    // Instead, we're relying on the extracted text which is more efficient
    
    // Make the request to our server endpoint
    const response = await fetch('/api/pdf-analyzer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Just send the text - more reliable and works with large files
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