import { Request, Response } from 'express';
import { analyzeTextContent } from '../services/openaiService';

/**
 * Handle PDF content analysis using OpenAI
 */
export async function analyzePdf(req: Request, res: Response) {
  try {
    const { text, fileName, fileSize, pageCount } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'No text content provided for analysis.'
      });
    }

    // Format document info
    const documentInfo = {
      fileName: fileName || 'document.pdf',
      fileSize: fileSize || 0,
      pageCount: pageCount || 0,
      processingTime: new Date().toISOString()
    };

    // Get AI analysis of the PDF content
    try {
      const analysis = await analyzeTextContent(text);
      
      return res.json({
        success: true,
        analysis,
        documentInfo
      });
    } catch (aiError) {
      console.error('Error during OpenAI analysis of PDF:', aiError);
      
      // Return failure but with document info
      return res.json({
        success: false,
        message: 'Could not complete AI analysis. Showing basic document information only.',
        documentInfo
      });
    }

  } catch (error) {
    console.error('Error processing PDF analysis request:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while analyzing PDF content.'
    });
  }
}