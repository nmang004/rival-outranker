/**
 * Service for sending PDF content to the server for AI analysis
 */

/**
 * Send actual PDF file or extracted text for AI-powered analysis
 * 
 * @param pdfFile The actual PDF file object (if available)
 * @param pdfText The extracted text content from the PDF (fallback)
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
  pdfFile?: File | Blob
): Promise<{
  success: boolean;
  analysis?: string;
  documentInfo?: any;
  message?: string;
}> {
  try {
    // If we have the actual PDF file, use it directly
    let pdfData: string | undefined;
    
    if (pdfFile) {
      try {
        // Convert the PDF file to base64
        console.log("Converting PDF file to base64...");
        const arrayBuffer = await pdfFile.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        pdfData = btoa(
          bytes.reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        console.log("PDF successfully converted to base64");
      } catch (conversionError) {
        console.error("Error converting PDF to base64:", conversionError);
        // Fall back to text-only analysis
        console.log("Falling back to text-only analysis");
      }
    }
    
    // Make the request to our server endpoint
    const response = await fetch('/api/pdf-analyzer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Send both the PDF data and text so the server can decide which to use
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