import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Creates a formatted PDF of the deep content analysis results
 */
export async function exportDeepContentToPDF(
  contentData: any,
  url: string,
  keywords?: string
): Promise<void> {
  try {
    // Create new PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Set basic document properties
    pdf.setProperties({
      title: `Deep Content Analysis for ${url}`,
      subject: 'SEO Content Analysis',
      author: 'SEO Analysis Tool',
      keywords: keywords || '',
      creator: 'SEO Analysis Tool',
    });

    // Add header
    pdf.setFontSize(22);
    pdf.setTextColor(13, 23, 42); // Dark blue color
    pdf.text('Deep Content Analysis Report', 105, 20, { align: 'center' });

    // Add URL info
    pdf.setFontSize(12);
    pdf.setTextColor(55, 65, 81); // Gray color
    pdf.text(`URL: ${url}`, 20, 30);
    if (keywords) {
      pdf.text(`Target Keywords: ${keywords}`, 20, 37);
    }
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, keywords ? 44 : 37);
    
    // Add horizontal line
    pdf.setDrawColor(229, 231, 235); // Light gray color
    pdf.setLineWidth(0.5);
    pdf.line(20, keywords ? 48 : 41, 190, keywords ? 48 : 41);

    // Add overall score section
    let yPos = keywords ? 60 : 50;
    pdf.setFontSize(16);
    pdf.setTextColor(13, 23, 42);
    pdf.text('Overall Content Score', 20, yPos);
    
    // Draw overall score circle
    const scoreColor = contentData.overallScore.score >= 80 ? [16, 185, 129] : // Green
                      contentData.overallScore.score >= 60 ? [245, 158, 11] : // Yellow
                      [239, 68, 68]; // Red
    
    yPos += 10;
    const circleX = 40;
    const circleY = yPos + 15;
    const circleRadius = 15;
    
    // Draw filled circle
    pdf.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    pdf.circle(circleX, circleY, circleRadius, 'F');
    
    // Add score text in circle
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.text(contentData.overallScore.score.toString(), circleX, circleY + 1, { align: 'center' });
    
    // Add score explanation
    pdf.setTextColor(55, 65, 81);
    pdf.setFontSize(11);
    const scoreText = contentData.overallScore.score >= 80 ? 'Excellent content quality' :
                     contentData.overallScore.score >= 60 ? 'Good content with room for improvement' :
                     'Content needs significant improvement';
    pdf.text(scoreText, 70, circleY);
    
    yPos += 40;
    
    // Section scores
    pdf.setFontSize(16);
    pdf.setTextColor(13, 23, 42);
    pdf.text('Content Section Scores', 20, yPos);
    
    yPos += 10;
    
    // Create section scores table
    const sectionData = [
      ['Structure', Math.round((
        contentData.structure.headingStructure.score + 
        contentData.structure.paragraphStructure.score + 
        contentData.structure.contentDistribution.score
      ) / 3) + '%'],
      ['Readability', Math.round((
        contentData.readability.fleschReadingEase.score +
        contentData.readability.sentenceComplexity.score +
        contentData.readability.wordChoice.score
      ) / 3) + '%'],
      ['Semantic Relevance', Math.round((
        contentData.semanticRelevance.topicCoverage.score +
        contentData.semanticRelevance.keywordContext.score +
        contentData.semanticRelevance.entityAnalysis.score
      ) / 3) + '%'],
      ['Engagement', Math.round((
        contentData.engagement.contentFormats.score +
        contentData.engagement.interactiveElements.score +
        contentData.engagement.callsToAction.score
      ) / 3) + '%']
    ];
    
    autoTable(pdf, {
      startY: yPos,
      head: [['Section', 'Score']],
      body: sectionData,
      theme: 'grid',
      headStyles: {
        fillColor: [59, 130, 246], // Blue
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 10,
        cellPadding: 4,
      },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 40, halign: 'center' },
      }
    });
    
    yPos = (pdf as any).lastAutoTable.finalY + 15;
    
    // Add new page if needed for recommendations
    if (yPos > 220) {
      pdf.addPage();
      yPos = 20;
    }
    
    // Key recommendations section
    pdf.setFontSize(16);
    pdf.setTextColor(13, 23, 42);
    pdf.text('Key Recommendations', 20, yPos);
    
    yPos += 10;
    
    if (contentData.recommendations && contentData.recommendations.length > 0) {
      // Add each recommendation as a bullet point
      pdf.setFontSize(10);
      pdf.setTextColor(55, 65, 81);
      
      contentData.recommendations.forEach((recommendation: string, index: number) => {
        // Check if we need a new page
        if (yPos > 270) {
          pdf.addPage();
          yPos = 20;
        }
        
        pdf.setDrawColor(59, 130, 246); // Blue
        pdf.setFillColor(59, 130, 246);
        pdf.circle(23, yPos - 1, 1, 'F');
        pdf.text(recommendation, 26, yPos);
        yPos += recommendation.length > 70 ? 14 : 8; // Add more space for longer recommendations
      });
    } else {
      pdf.setFontSize(10);
      pdf.setTextColor(55, 65, 81);
      pdf.text('No specific recommendations available.', 20, yPos + 5);
      yPos += 15;
    }

    // Add footer to each page
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(9);
      pdf.setTextColor(107, 114, 128);
      pdf.text(
        `Page ${i} of ${pageCount} - Generated by SEO Analysis Tool`,
        105,
        285,
        { align: 'center' }
      );
    }

    // Save the PDF with formatted filename
    const cleanUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/[^a-zA-Z0-9]/g, '-');
    pdf.save(`deep-content-analysis-${cleanUrl}.pdf`);
    
    return Promise.resolve();
  } catch (error) {
    console.error('Error exporting PDF:', error);
    return Promise.reject(error);
  }
}