/**
 * Service for sending PDF content to the server for AI analysis
 */

/**
 * Send extracted PDF text to the server for AI-powered analysis
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
  pageCount?: number
): Promise<{
  success: boolean;
  analysis?: string;
  documentInfo?: any;
  message?: string;
}> {
  try {
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

    return await response.json();
  } catch (error) {
    console.error('Error analyzing PDF content:', error);
    return {
      success: false,
      message: `Failed to analyze PDF: ${error.message || 'Unknown error'}`
    };
  }
}

export default {
  analyzePdfContent
};