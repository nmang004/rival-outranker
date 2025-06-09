import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CompetitorAnalysisResult } from '@shared/schema';

/**
 * Creates a formatted PDF of the competitor analysis results
 */
export async function exportCompetitorToPDF(
  competitorData: any,
  url: string,
  city: string
): Promise<void> {
  try {
    // Create new PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Set some basic document properties
    pdf.setProperties({
      title: `Competitor Analysis for ${url} in ${city}`,
      subject: 'SEO Competitor Analysis',
      author: 'SEO Analysis Tool',
      keywords: competitorData.keyword || '',
      creator: 'SEO Analysis Tool',
    });

    // Add header
    pdf.setFontSize(22);
    pdf.setTextColor(13, 23, 42); // Dark blue color
    pdf.text('Competitor Analysis Report', 105, 20, { align: 'center' });

    // Add URL and location info
    pdf.setFontSize(12);
    pdf.setTextColor(55, 65, 81); // Gray color
    pdf.text(`URL: ${url}`, 20, 30);
    pdf.text(`Location: ${city}`, 20, 37);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 44);
    
    // Add keyword info if available
    if (competitorData.keyword) {
      pdf.text(`Target Keyword: ${competitorData.keyword}`, 20, 51);
    }
    
    // Add horizontal line
    pdf.setDrawColor(229, 231, 235); // Light gray color
    pdf.setLineWidth(0.5);
    pdf.line(20, 55, 190, 55);

    // Add competitors section title
    pdf.setFontSize(16);
    pdf.setTextColor(13, 23, 42);
    pdf.text('Top Competitors', 20, 65);

    // Create competitors table
    if (competitorData.competitors && competitorData.competitors.length > 0) {
      const competitorTableData = competitorData.competitors.map((competitor: any, index: number) => [
        index + 1,
        competitor.name || 'Unnamed Competitor',
        competitor.url || 'No URL',
        competitor.score || '-',
        competitor.domainAuthority || '-',
      ]);

      autoTable(pdf, {
        startY: 70,
        head: [['#', 'Name', 'URL', 'Score', 'DA']],
        body: competitorTableData,
        theme: 'grid',
        headStyles: {
          fillColor: [59, 130, 246], // Blue
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 40 },
          2: { cellWidth: 70 },
          3: { cellWidth: 20 },
          4: { cellWidth: 20 }
        }
      });
    } else {
      pdf.setFontSize(12);
      pdf.setTextColor(107, 114, 128);
      pdf.text('No competitor data available.', 20, 75);
    }

    // Get Y position after competitor table
    let yPos = (pdf as any).lastAutoTable.finalY + 15 || 90;

    // Check if we need a new page for keyword gap
    if (yPos > 230) {
      pdf.addPage();
      yPos = 20;
    }

    // Add keyword gap section
    if (competitorData.keywordGap && competitorData.keywordGap.length > 0) {
      pdf.setFontSize(16);
      pdf.setTextColor(13, 23, 42);
      pdf.text('Keyword Gap Analysis', 20, yPos);
      
      const keywordGapData = competitorData.keywordGap.map((keyword: any) => [
        keyword.term || '-',
        keyword.volume?.toString() || '-',
        keyword.competition || '-',
        keyword.topCompetitor || '-',
      ]);

      autoTable(pdf, {
        startY: yPos + 5,
        head: [['Keyword', 'Volume', 'Competition', 'Top Competitor']],
        body: keywordGapData,
        theme: 'grid',
        headStyles: {
          fillColor: [59, 130, 246], // Blue
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
      });
      
      yPos = (pdf as any).lastAutoTable.finalY + 15;
    }

    // Check if we need a new page for all competitors
    if (yPos > 230) {
      pdf.addPage();
      yPos = 20;
    }

    // Add all competitors section (the full SERP)
    if (competitorData.allCompetitorUrls && competitorData.allCompetitorUrls.length > 0) {
      pdf.setFontSize(16);
      pdf.setTextColor(13, 23, 42);
      pdf.text('Complete SERP Results', 20, yPos);
      
      const allCompetitorsData = competitorData.allCompetitorUrls.map((comp: any, index: number) => [
        index + 1,
        comp.name || '-',
        comp.url || '-',
      ]);

      autoTable(pdf, {
        startY: yPos + 5,
        head: [['Rank', 'Domain', 'URL']],
        body: allCompetitorsData,
        theme: 'grid',
        headStyles: {
          fillColor: [59, 130, 246], // Blue
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 9,
          cellPadding: 2,
        },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 40 },
          2: { cellWidth: 115 },
        }
      });
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
    const cleanCity = city.replace(/[^a-zA-Z0-9]/g, '-');
    pdf.save(`competitor-analysis-${cleanUrl}-${cleanCity}.pdf`);
    
    return Promise.resolve();
  } catch (error) {
    console.error('Error exporting PDF:', error);
    return Promise.reject(error);
  }
}