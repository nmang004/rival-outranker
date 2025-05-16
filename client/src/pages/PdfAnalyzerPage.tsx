import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, FileText, Upload, X, AlertTriangle, Download, File, Image as ImageIcon, Loader2, Code, Globe, Search, Layers, Share2, MapPin, BarChart } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

// Sample document API paths
const summaryPdf = '/api/samples/pdf/summary';
const onPagePdf = '/api/samples/pdf/on-page';
const structureNavigationPdf = '/api/samples/pdf/structure-navigation';
const contactPagePdf = '/api/samples/pdf/contact-page';
const servicePagesPdf = '/api/samples/pdf/service-pages';

// Summary card component
interface SummaryCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, description, icon, color }) => (
  <Card className="p-4 flex flex-col h-full">
    <div className="flex items-start justify-between mb-2">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <div className={`p-2 rounded-full ${color}`}>
        {icon}
      </div>
    </div>
    <div className="mt-1">
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  </Card>
);

// Main PDF Analyzer Component
// Sample files for demonstration
const SAMPLE_FILES = [
  {
    name: "SEO Metrics Chart",
    type: "image",
    description: "Bar chart showing performance metrics for organic traffic",
    path: "/samples/seo-chart.png",
    source: "internal"
  },
  {
    name: "Keyword Rankings Graph",
    type: "image",
    description: "Line graph tracking keyword position changes over time",
    path: "/samples/keyword-trend.png",
    source: "internal"
  },
  {
    name: "SEO Audit Summary",
    type: "pdf",
    description: "Sample report with audit findings and improvement suggestions",
    path: "/samples/seo-audit-sample.pdf",
    source: "internal"
  }
];

const PdfAnalyzerPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'pdf' | 'image' | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [analysisComplete, setAnalysisComplete] = useState<boolean>(false);
  const [summary, setSummary] = useState<any>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showSamples, setShowSamples] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>('');

  // Function to determine file type
  const determineFileType = (file: File): 'pdf' | 'image' | null => {
    if (file.type === 'application/pdf') {
      return 'pdf';
    } else if (file.type.startsWith('image/')) {
      return 'image';
    }
    return null;
  };

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    setAnalysisComplete(false);
    setSummary(null);
    setExtractedText('');
    setProgress(0);
    setProcessingStep('');
    
    // Check if any files were accepted
    if (acceptedFiles.length === 0) {
      return;
    }
    
    const file = acceptedFiles[0];
    const fileType = determineFileType(file);
    
    if (!fileType) {
      setError('Unsupported file type. Please upload a PDF or image file.');
      return;
    }
    
    setFile(file);
    setFileType(fileType);
    setProcessingStep('File loaded successfully');
    
    // Create previews
    if (fileType === 'pdf') {
      const url = URL.createObjectURL(file);
      setPdfPreviewUrl(url);
      setImagePreview(null);
    } else if (fileType === 'image') {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setPdfPreviewUrl(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.tiff', '.webp'],
    },
    maxFiles: 1,
    multiple: false,
  });

  // Extract text from PDF
  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      console.log('Starting PDF text extraction, file size:', file.size, 'bytes');
      
      // Make sure the file is valid
      if (!file || file.size === 0) {
        throw new Error('Invalid or empty PDF file');
      }
      
      const arrayBuffer = await file.arrayBuffer();
      console.log('Successfully created array buffer, size:', arrayBuffer.byteLength);
      
      // Load the PDF document
      setProcessingStep('Loading PDF document...');
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      console.log('PDF document loaded successfully, pages:', pdf.numPages);
      
      let fullText = '';
      const totalPages = pdf.numPages;
      
      for (let i = 1; i <= totalPages; i++) {
        // Update progress
        setProgress(Math.floor((i / totalPages) * 50));
        setProcessingStep(`Extracting text from page ${i} of ${totalPages}...`);
        
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n';
        
        console.log(`Extracted text from page ${i}, content length:`, pageText.length);
      }
      
      console.log('PDF text extraction complete, total text length:', fullText.length);
      
      // If we didn't get any text, warn but don't fail completely
      if (fullText.trim().length === 0) {
        console.warn('Extracted text is empty');
        fullText = 'The PDF appears to be empty or contains only images without text. Please try an image-based extraction.';
      }
      
      return fullText;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error(`Failed to extract text from PDF: ${error.message || 'Unknown error'}`);
    }
  };

  // Extract text from image
  const extractTextFromImage = async (file: File): Promise<string> => {
    try {
      // Function to create an enhanced canvas version of the image
      const enhanceImage = async (imgFile: File): Promise<HTMLCanvasElement> => {
        return new Promise((resolve) => {
          const img = new Image() as HTMLImageElement;
          const url = URL.createObjectURL(imgFile);
          
          img.onload = () => {
            // Create canvas element
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas dimensions
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Draw original image to canvas
            ctx?.drawImage(img, 0, 0, img.width, img.height);
            
            // Apply basic image enhancements for OCR
            if (ctx) {
              // Get image data
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const data = imageData.data;
              
              // Increase contrast and convert to grayscale
              for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                const newVal = avg > 127 ? 255 : 0; // Increase contrast
                
                data[i] = newVal;     // R
                data[i + 1] = newVal; // G
                data[i + 2] = newVal; // B
              }
              
              // Put enhanced image data back to canvas
              ctx.putImageData(imageData, 0, 0);
            }
            
            URL.revokeObjectURL(url);
            resolve(canvas);
          };
          
          img.src = url;
        });
      };
      
      // First pass with standard settings
      const initialResult = await Tesseract.recognize(file, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.floor(m.progress * 25)); // First 25% of progress
          }
        }
      });
      
      // Determine if the image might contain a graph/chart/table
      const detectGraphsAndTables = (text: string): boolean => {
        const textLower = text.toLowerCase();
        
        // Check for common terms used in data visualizations
        const chartTerms = ['chart', 'graph', 'figure', 'table', 'axis', 'plot', 
                           'bar chart', 'line chart', 'pie chart', 'histogram', 
                           'trend', 'distribution', 'percentage', 'statistics',
                           'metrics', 'growth', 'decline', 'ranking'];
                           
        // Check for data patterns (numbers in sequence or with % signs)
        const hasDataPatterns = textLower.match(/(\d+(\.\d+)?%)|(\d+\.?\d*\s*[,-]\s*\d+\.?\d*)/g);
        
        // Check for month names (common in time series)
        const monthPattern = /jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i;
        const hasMonths = monthPattern.test(textLower);
        
        // Return true if any chart terms are present or data patterns are detected
        return chartTerms.some(term => textLower.includes(term)) || 
               (hasDataPatterns !== null && hasDataPatterns.length > 3) ||
               hasMonths;
      };
      
      // Check if the image might contain a graph/chart/table
      const mightContainGraphOrTable = detectGraphsAndTables(initialResult.data.text);
      
      if (mightContainGraphOrTable) {
        // Enhance image for better OCR
        const enhancedCanvas = await enhanceImage(file);
        
        // Second pass with optimized settings for graphs/charts/tables
        const dataImageResult = await Tesseract.recognize(enhancedCanvas, 'eng', {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setProgress(25 + Math.floor(m.progress * 25)); // Next 25% of progress
            }
          }
        });
        
        // Combine results with a note about chart detection
        return initialResult.data.text + 
               '\n\n[CHART/GRAPH DETECTED: Enhanced OCR Applied]\n\n' + 
               dataImageResult.data.text;
      }
      
      return initialResult.data.text;
    } catch (error) {
      console.error('Error extracting text from image:', error);
      throw new Error('Failed to extract text from image');
    }
  };

  // Analyze the extracted text
  const analyzeText = (text: string): any => {
    // Update progress
    setProgress(75);
    
    // This would be where you'd integrate with a more sophisticated analysis tool,
    // like OpenAI or Claude, but for this demo we'll use some basic analysis

    // Function to detect and analyze chart data
    const analyzeChartData = (text: string) => {
      // Check if chart detection message exists
      const isChartDetected = text.includes('[CHART/GRAPH DETECTED:');
      
      // If no chart is detected, return empty results
      if (!isChartDetected) return { isChartData: false };
      
      // Look for patterns that suggest chart type
      const chartTypes = {
        bar: ['bar chart', 'bar graph', 'histogram', 'column chart'],
        line: ['line chart', 'line graph', 'trend line', 'time series'],
        pie: ['pie chart', 'donut chart', 'circle graph', 'distribution'],
        table: ['table', 'grid', 'data table', 'dataset']
      };
      
      const textLower = text.toLowerCase();
      
      // Determine chart type
      let detectedType = 'unknown';
      for (const [type, keywords] of Object.entries(chartTypes)) {
        if (keywords.some(keyword => textLower.includes(keyword))) {
          detectedType = type;
          break;
        }
      }
      
      // Extract numeric values (potential data points)
      const numericValues = Array.from(
        textLower.matchAll(/\b(\d+(\.\d+)?%?)\b/g)
      ).map(match => match[1]);
      
      // Extract potential labels (capitalized words or words near numbers)
      const potentialLabels = Array.from(
        text.matchAll(/\b([A-Z][a-z]+)\b|\b([A-Za-z]+)(?=\s*:?\s*\d)/g)
      ).map(match => match[0]);
      
      // Look for date patterns (common in time-series charts)
      const datePatterns = Array.from(
        text.matchAll(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s\.,]|(\d{1,2}[\/\-]\d{1,2}([\/\-]\d{2,4})?)\b/gi)
      ).map(match => match[0]);
      
      return {
        isChartData: true,
        chartType: detectedType,
        dataPoints: numericValues.length,
        hasLabels: potentialLabels.length > 0,
        hasTimeSeries: datePatterns.length > 0,
        extractedValues: numericValues.slice(0, 10), // First 10 values for analysis
        extractedLabels: Array.from(new Set(potentialLabels)).slice(0, 10) // Deduplicated, first 10
      };
    };

    // Prepare regex patterns for common SEO terms
    const metaTagPattern = /meta\s*(name|property|http-equiv)=["']([^"']+)["']/gi;
    const h1Pattern = /<h1[^>]*>(.*?)<\/h1>/gi;
    const linkPattern = /<a\s+(?:[^>]*?\s+)?href=["']([^"']*)["']/gi;
    const imgPattern = /<img\s+[^>]*?src=["']([^"']*)["'][^>]*?>/gi;
    const titlePattern = /<title[^>]*>(.*?)<\/title>/gi;
    const canonicalPattern = /<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/gi;
    const robotsPattern = /<meta\s+name=["']robots["']\s+content=["']([^"']*)["']/gi;
    
    // Additional patterns for SEO report data
    const scorePattern = /\b(score|rating|grade|value|index)[\s:]+(\d+(\.\d+)?%?|\d+(\.\d+)?\/\d+(\.\d+)?)\b/gi;
    const kpiPattern = /\b(impressions|clicks|ctr|position|ranking|traffic|visitors|pageviews|bounce rate|conversions)\b/gi;
    const keywordMentions = (text: string): { [key: string]: number } => {
      const keywords = ['seo', 'search engine', 'keyword', 'backlink', 'ranking', 'meta description', 'title tag', 'alt text', 'canonical', 'robots'];
      return keywords.reduce((acc, keyword) => {
        const pattern = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = text.match(pattern);
        acc[keyword] = matches ? matches.length : 0;
        return acc;
      }, {} as { [key: string]: number });
    };

    // Check for chart data
    const chartData = analyzeChartData(text);
    
    // Extract SEO scores and metrics from the text
    const extractedScores = Array.from(text.matchAll(scorePattern)).map(match => ({
      metric: match[1].trim().toLowerCase(),
      value: match[2].trim()
    }));
    
    // Extract key SEO KPIs mentioned in the text
    const mentionedKpis = Array.from(text.matchAll(kpiPattern)).map(match => 
      match[0].trim().toLowerCase()
    );
    
    // Extract key SEO elements
    const metaTags = Array.from(text.matchAll(metaTagPattern)).map(match => match[0]);
    const h1Tags = Array.from(text.matchAll(h1Pattern)).map(match => match[1]);
    const links = Array.from(text.matchAll(linkPattern)).map(match => match[1]);
    const images = Array.from(text.matchAll(imgPattern)).map(match => match[0]);
    const titles = Array.from(text.matchAll(titlePattern)).map(match => match[1]);
    const canonicals = Array.from(text.matchAll(canonicalPattern)).map(match => match[1]);
    const robots = Array.from(text.matchAll(robotsPattern)).map(match => match[1]);
    const keywordStats = keywordMentions(text);

    // Count important SEO aspects
    const missingAltText = images.filter(img => !img.includes('alt=')).length;
    const externalLinks = links.filter(link => link.startsWith('http')).length;
    const internalLinks = links.length - externalLinks;
    const keywordDensity = Object.values(keywordStats).reduce((sum, count) => sum + count, 0) / (text.split(' ').length || 1) * 100;

    // Generate simple ratings
    const titleLengthScore = titles[0] ? (titles[0].length > 30 && titles[0].length < 60 ? 'Good' : 'Needs Improvement') : 'Missing';
    const h1Score = h1Tags.length === 1 ? 'Good' : (h1Tags.length === 0 ? 'Missing' : 'Multiple H1s');
    const canonicalScore = canonicals.length === 1 ? 'Good' : (canonicals.length === 0 ? 'Missing' : 'Multiple Canonicals');
    const robotsScore = robots.length >= 1 ? 'Present' : 'Not Found';
    const altTextScore = missingAltText === 0 ? 'Good' : `${missingAltText} images missing alt text`;
    
    // Calculate overall SEO score (simple example)
    let seoScore = 0;
    if (titleLengthScore === 'Good') seoScore += 20;
    if (h1Score === 'Good') seoScore += 15;
    if (canonicalScore === 'Good') seoScore += 15;
    if (robotsScore === 'Present') seoScore += 10;
    if (missingAltText === 0) seoScore += 15;
    if (externalLinks > 0) seoScore += 10;
    if (internalLinks > 0) seoScore += 15;
    
    // If we found extracted scores, try to use them to refine our score
    if (extractedScores.length > 0) {
      // Look for overall score metrics that might be in the document
      const overallScoreMetrics = extractedScores.filter(score => 
        score.metric.includes('overall') || 
        score.metric.includes('total') || 
        score.metric.includes('score') ||
        score.metric.includes('performance')
      );
      
      if (overallScoreMetrics.length > 0) {
        // Try to parse the most relevant overall score
        const mainScore = overallScoreMetrics[0].value;
        // If it's a percentage, use it directly
        if (mainScore.includes('%')) {
          const parsedScore = parseInt(mainScore.replace('%', ''));
          if (!isNaN(parsedScore)) {
            seoScore = parsedScore; // Use the extracted score instead
          }
        } 
        // If it's a ratio like 85/100
        else if (mainScore.includes('/')) {
          const [numerator, denominator] = mainScore.split('/').map(n => parseInt(n.trim()));
          if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
            seoScore = Math.round((numerator / denominator) * 100);
          }
        }
      }
    }
    
    // Prepare recommendations
    const recommendations = [];
    if (titleLengthScore !== 'Good') recommendations.push('Optimize title tag length (30-60 characters)');
    if (h1Score !== 'Good') recommendations.push('Ensure page has exactly one H1 tag');
    if (canonicalScore !== 'Good') recommendations.push('Add or fix canonical tag');
    if (robotsScore !== 'Present') recommendations.push('Consider adding robots meta directive');
    if (missingAltText > 0) recommendations.push('Add alt text to all images');
    if (externalLinks === 0) recommendations.push('Consider adding relevant external links');
    if (internalLinks < 3) recommendations.push('Add more internal links for better navigation');
    
    // Update progress
    setProgress(90);
    
    // Return analyzed data
    return {
      seoScore,
      elements: {
        metaTags: metaTags.length,
        h1Tags: h1Tags.length,
        links: links.length,
        images: images.length,
        externalLinks,
        internalLinks,
      },
      ratings: {
        titleLengthScore,
        h1Score,
        canonicalScore,
        robotsScore,
        altTextScore,
      },
      keywordStats,
      keywordDensity: keywordDensity.toFixed(2) + '%',
      recommendations,
      
      // Add extraction metrics 
      extractedMetrics: {
        scores: extractedScores,
        kpis: mentionedKpis
      },
      
      // Add chart data if detected
      chartData: chartData && chartData.isChartData ? {
        type: chartData.chartType,
        dataPoints: chartData.dataPoints,
        hasTimeSeries: chartData.hasTimeSeries,
        sampleValues: chartData.extractedValues,
        sampleLabels: chartData.extractedLabels
      } : null
    };
  };

  // Process the file
  const processFile = async () => {
    if (!file || !fileType) {
      setError('Please upload a file first');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setProgress(0);
    setProcessingStep('Starting document analysis...');
    
    try {
      let text = '';
      if (fileType === 'pdf') {
        setProcessingStep('Extracting text from PDF document...');
        text = await extractTextFromPdf(file);
      } else if (fileType === 'image') {
        setProcessingStep('Performing OCR on image...');
        text = await extractTextFromImage(file);
      }
      
      setExtractedText(text);
      setProcessingStep('Identifying SEO elements...');
      
      // Initial analysis with local processing
      const analysisSummary = analyzeText(text);
      setProgress(70);
      setProcessingStep('Initial analysis complete...');
      
      try {
        // Get chart data for AI analysis
        const chartData = analysisSummary.chartData;
        
        // Perform AI-powered analysis
        setProcessingStep('Performing AI analysis...');
        
        const aiResponse = await fetch('/api/analyze-content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text,
            chartData: chartData && chartData.isChartData ? chartData : null
          }),
        });
        
        if (aiResponse.ok) {
          const aiAnalysis = await aiResponse.json();
          
          // Enhance analysis with AI insights
          analysisSummary.aiAnalysis = {
            insights: aiAnalysis.textAnalysis?.analysis || 'No AI analysis available',
            chartInsights: aiAnalysis.chartAnalysis?.analysis || '',
            recommendations: aiAnalysis.recommendations?.recommendations || []
          };
          
          console.log('AI analysis completed successfully');
        } else {
          console.error('AI analysis failed:', await aiResponse.text());
          analysisSummary.aiAnalysis = {
            insights: 'AI analysis unavailable at this time',
            recommendations: []
          };
        }
      } catch (aiError) {
        console.error('Error during AI analysis:', aiError);
        analysisSummary.aiAnalysis = {
          insights: 'AI analysis failed. Please try again later.',
          recommendations: []
        };
      }
      
      // Update with final results including AI analysis
      setSummary(analysisSummary);
      setProcessingStep('Analysis complete!');
      
      // Complete
      setProgress(100);
      setAnalysisComplete(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred during processing');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Clear the file
  const clearFile = () => {
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl);
    }
    setFile(null);
    setFileType(null);
    setPdfPreviewUrl(null);
    setImagePreview(null);
    setExtractedText('');
    setAnalysisComplete(false);
    setSummary(null);
    setProgress(0);
    setError(null);
  };
  
  // Load sample document
  const loadSampleDocument = async (samplePath: string, sampleName: string) => {
    try {
      setIsProcessing(true);
      setError(null);
      setProgress(10);
      setProcessingStep('Loading sample document...');
      
      // Fetch the sample document
      console.log('Fetching sample document from:', samplePath);
      const response = await fetch(samplePath, {
        method: 'GET',
        cache: 'no-cache', // Avoid caching issues
        headers: {
          'Accept': 'application/pdf'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error details available');
        console.error('Sample document fetch failed:', response.status, errorText);
        throw new Error(`Failed to load sample document. Server responded with status ${response.status}: ${errorText}`);
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      console.log('Sample document blob received, type:', blob.type, 'size:', blob.size, 'bytes');
      
      if (blob.size === 0) {
        throw new Error('The sample document is empty. Please try again or select a different document.');
      }
      
      // Ensure we have the correct MIME type
      const blobWithCorrectType = blob.type === 'application/pdf' 
        ? blob 
        : new Blob([await blob.arrayBuffer()], { type: 'application/pdf' });
      
      const fileName = sampleName || 'sample-document.pdf';
      
      // Create a proper File object from the blob with the needed properties
      try {
        const fileObj = new File([blobWithCorrectType], fileName, { 
          type: 'application/pdf',
          lastModified: Date.now()
        });
        
        // Make sure the File object has the right properties
        if (!fileObj.type || fileObj.size === 0) {
          throw new Error('Created file object is invalid');
        }
        
        // Set the file and type
        setFile(fileObj);
        setFileType('pdf');
        
        // Create preview URL
        const previewUrl = URL.createObjectURL(fileObj);
        setPdfPreviewUrl(previewUrl);
        
        console.log('File object created successfully:', fileObj.name, fileObj.type, fileObj.size, 'bytes');
        
        setProgress(30);
        setProcessingStep('Sample document loaded successfully');
        
        // Automatically process the sample document after a short delay for better UX
        await new Promise(resolve => setTimeout(resolve, 800)); 
        processFile();
      } catch (fileError: any) {
        console.error('Error creating File object:', fileError);
        throw new Error(`Failed to create File object: ${fileError.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error loading sample document:', error);
      setError(`Failed to load sample document: ${error.message || 'Unknown error'}`);
      setIsProcessing(false);
    }
  };

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, [pdfPreviewUrl]);

  const getRecommendationBadgeColor = (index: number) => {
    const colors = [
      "bg-red-100 text-red-800",
      "bg-yellow-100 text-yellow-800",
      "bg-blue-100 text-blue-800",
      "bg-green-100 text-green-800",
      "bg-purple-100 text-purple-800",
      "bg-indigo-100 text-indigo-800",
      "bg-pink-100 text-pink-800"
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">PDF and Image SEO Analyzer</h1>
        <p className="text-muted-foreground">
          Upload a PDF or image file of an SEO audit to analyze the content and extract insights.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {/* File upload area */}
          <Card className="p-6">
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              
              {file ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    {fileType === 'pdf' ? (
                      <File className="h-16 w-16 text-primary" />
                    ) : (
                      <ImageIcon className="h-16 w-16 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {fileType === 'pdf' ? 'PDF Document' : 'Image File'}
                    </p>
                  </div>
                  
                  {/* Document preview */}
                  {fileType === 'pdf' && pdfPreviewUrl && (
                    <div className="mt-4 border rounded-md overflow-hidden h-[300px]">
                      <object 
                        data={pdfPreviewUrl} 
                        type="application/pdf"
                        className="w-full h-full"
                      >
                        <p>PDF preview not available</p>
                      </object>
                    </div>
                  )}
                  
                  {fileType === 'image' && imagePreview && (
                    <div className="mt-4 border rounded-md overflow-hidden">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="max-w-full h-auto max-h-[300px] mx-auto"
                      />
                    </div>
                  )}
                  <div className="flex gap-2 justify-center">
                    <Button 
                      variant="outline" 
                      className="gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFile();
                      }}
                    >
                      <X className="h-4 w-4" />
                      Remove
                    </Button>
                    
                    <Button 
                      className="gap-2 bg-[#52bb7a] hover:bg-[#43a067]"
                      onClick={(e) => {
                        e.stopPropagation();
                        processFile();
                      }}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4" />
                          Analyze Document
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <Upload className="h-16 w-16 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Upload an SEO document or image</p>
                    <p className="text-sm text-muted-foreground">
                      Drag and drop a PDF or image file, or click to browse
                    </p>
                  </div>
                  <div>
                    <Button className="gap-2 bg-[#52bb7a] hover:bg-[#43a067]">
                      <Upload className="h-4 w-4" />
                      Select File
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Supports PDF, PNG, JPG, JPEG and other image formats
                  </p>
                </div>
              )}
            </div>
          </Card>
          
          {/* Sample documents section */}
          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <FileText className="h-5 w-5 mr-2 text-primary" />
                Sample SEO Audit Documents
              </h3>
              <p className="text-sm text-muted-foreground">
                Don't have an SEO audit PDF? Try analyzing one of our sample documents to see how the analyzer works:
              </p>
              
              <div className="grid grid-cols-1 gap-4">
                {/* Summary Document */}
                <div className="border rounded-lg p-4 hover:border-primary/50 hover:bg-muted/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium flex items-center">
                        <File className="h-4 w-4 mr-2 text-blue-600" />
                        SEO Audit Summary
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1 mb-3">
                        Overview of key SEO findings across all categories with prioritized recommendations.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-[#52bb7a] hover:bg-[#43a067] text-white"
                      onClick={() => loadSampleDocument(summaryPdf, 'SEO Audit - Summary.pdf')}
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Loading...' : 'Analyze'}
                    </Button>
                  </div>
                </div>
                
                {/* On-Page Document */}
                <div className="border rounded-lg p-4 hover:border-primary/50 hover:bg-muted/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium flex items-center">
                        <File className="h-4 w-4 mr-2 text-blue-600" />
                        On-Page SEO Analysis
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1 mb-3">
                        Detailed assessment of content quality, user experience, and on-page ranking factors.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-[#52bb7a] hover:bg-[#43a067] text-white"
                      onClick={() => loadSampleDocument(onPagePdf, 'SEO Audit - On-Page.pdf')}
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Loading...' : 'Analyze'}
                    </Button>
                  </div>
                </div>
                
                {/* Structure & Navigation Document */}
                <div className="border rounded-lg p-4 hover:border-primary/50 hover:bg-muted/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium flex items-center">
                        <File className="h-4 w-4 mr-2 text-blue-600" />
                        Structure & Navigation Analysis
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1 mb-3">
                        Evaluation of website architecture, URL structure, and navigation elements.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-[#52bb7a] hover:bg-[#43a067] text-white"
                      onClick={() => loadSampleDocument(structureNavigationPdf, 'SEO Audit - Structure & Navigation.pdf')}
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Loading...' : 'Analyze'}
                    </Button>
                  </div>
                </div>
                
                {/* Contact Page Document */}
                <div className="border rounded-lg p-4 hover:border-primary/50 hover:bg-muted/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium flex items-center">
                        <File className="h-4 w-4 mr-2 text-blue-600" />
                        Contact Page Analysis
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1 mb-3">
                        Assessment of business information, contact forms, and local SEO elements.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-[#52bb7a] hover:bg-[#43a067] text-white"
                      onClick={() => loadSampleDocument(contactPagePdf, 'SEO Audit - Contact Page.pdf')}
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Loading...' : 'Analyze'}
                    </Button>
                  </div>
                </div>
                
                {/* Service Pages Document */}
                <div className="border rounded-lg p-4 hover:border-primary/50 hover:bg-muted/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium flex items-center">
                        <File className="h-4 w-4 mr-2 text-blue-600" />
                        Service Pages Analysis
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1 mb-3">
                        Review of service page content, calls-to-action, and conversion optimization.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-[#52bb7a] hover:bg-[#43a067] text-white"
                      onClick={() => loadSampleDocument(servicePagesPdf, 'SEO Audit - Service Pages.pdf')}
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Loading...' : 'Analyze'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Progress and errors */}
          {isProcessing && (
            <Card className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">{processingStep || 'Processing document...'}</p>
                  <span className="text-sm text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </Card>
          )}
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          {/* File preview */}
          {(pdfPreviewUrl || imagePreview) && (
            <Card className="overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-medium">Document Preview</h3>
                {pdfPreviewUrl && (
                  <a 
                    href={pdfPreviewUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary flex items-center gap-1"
                  >
                    <span>Open in new tab</span>
                    <FileText className="h-4 w-4" />
                  </a>
                )}
              </div>
              <div className="h-[400px] overflow-auto bg-gray-50">
                {pdfPreviewUrl && (
                  <iframe 
                    src={pdfPreviewUrl} 
                    className="w-full h-full" 
                    title="PDF Preview"
                  />
                )}
                {imagePreview && (
                  <div className="flex items-center justify-center h-full p-4">
                    <img 
                      src={imagePreview} 
                      alt="Uploaded" 
                      className="max-h-full max-w-full object-contain" 
                    />
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
        
        <div className="space-y-4">
          {/* Instructions card */}
          <Card className="p-4">
            <h3 className="font-medium mb-2">How it works</h3>
            <div className="space-y-3 text-sm">
              <div className="flex gap-2">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-xs font-medium">1</span>
                </div>
                <p>Upload a PDF document or image containing SEO audit information</p>
              </div>
              
              <div className="flex gap-2">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-xs font-medium">2</span>
                </div>
                <p>The system will extract text using OCR (for images) or PDF parsing technology</p>
              </div>
              
              <div className="flex gap-2">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-xs font-medium">3</span>
                </div>
                <p>Advanced analysis identifies key SEO metrics and recommendations</p>
              </div>
              
              <div className="flex gap-2">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-xs font-medium">4</span>
                </div>
                <p>Review the automatically generated high-level summary</p>
              </div>
            </div>
          </Card>
          
          {/* Tips card */}
          <Card className="p-4">
            <h3 className="font-medium mb-2">Best Practices</h3>
            <div className="space-y-2 text-sm">
              <div className="flex gap-2 items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <p>Use high-quality scans or screenshots for best results</p>
              </div>
              
              <div className="flex gap-2 items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <p>Ensure documents have clear, readable text without distortion</p>
              </div>
              
              <div className="flex gap-2 items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <p>For best results with PDF files, use text-based PDFs rather than scanned documents</p>
              </div>
              
              <div className="flex gap-2 items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <p>For charts and graphs, make sure they have clear labels and values</p>
              </div>
              
              <div className="flex gap-2 items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <p>The tool can detect and extract data from bar charts, line graphs, and tables</p>
              </div>
              
              <div className="flex gap-2 items-start">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                <p>Large documents may take longer to process</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Analysis results */}
      {analysisComplete && summary && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Analysis Results</h2>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>
          
          {/* SEO Score summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SummaryCard
              title="Overall SEO Score"
              value={`${summary.seoScore}/100`}
              description="Based on extracted SEO elements and best practices"
              icon={<FileText className="h-5 w-5 text-primary" />}
              color="bg-[#e6f5ec]"
            />
            
            <SummaryCard
              title="HTML Elements"
              value={`${summary.elements.metaTags}`}
              description={`${summary.elements.h1Tags} H1 tags, ${summary.elements.images} images`}
              icon={<Code className="h-5 w-5 text-blue-500" />}
              color="bg-blue-50"
            />
            
            <SummaryCard
              title="Links Analysis"
              value={`${summary.elements.links}`}
              description={`${summary.elements.externalLinks} external, ${summary.elements.internalLinks} internal`}
              icon={<LinkIcon className="h-5 w-5 text-indigo-500" />}
              color="bg-indigo-50"
            />
            
            <SummaryCard
              title="Keyword Density"
              value={summary.keywordDensity}
              description="Average keyword density in content"
              icon={<KeywordIcon className="h-5 w-5 text-purple-500" />}
              color="bg-purple-50"
            />
          </div>
          
          {/* Chart data section - only shown if charts are detected */}
          {summary.chartData && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">Data Visualization Detected</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground mb-1">Chart Type</p>
                  <p className="text-lg font-medium capitalize">{summary.chartData.type}</p>
                </div>
                
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground mb-1">Data Points</p>
                  <p className="text-lg font-medium">{summary.chartData.dataPoints}</p>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground mb-1">Time Series</p>
                  <p className="text-lg font-medium">{summary.chartData.hasTimeSeries ? 'Yes' : 'No'}</p>
                </div>
                
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground mb-1">Enhanced OCR</p>
                  <p className="text-lg font-medium">Applied</p>
                </div>
              </div>
              
              {summary.chartData.sampleLabels && summary.chartData.sampleLabels.length > 0 && (
                <div className="mb-4">
                  <p className="font-medium mb-2">Detected Labels</p>
                  <div className="flex flex-wrap gap-2">
                    {summary.chartData.sampleLabels.map((label: string, index: number) => (
                      <Badge key={index} variant="outline" className="bg-blue-50">
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {summary.chartData.sampleValues && summary.chartData.sampleValues.length > 0 && (
                <div>
                  <p className="font-medium mb-2">Detected Values</p>
                  <div className="flex flex-wrap gap-2">
                    {summary.chartData.sampleValues.map((value: string, index: number) => (
                      <Badge key={index} variant="outline" className="bg-green-50">
                        {value}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}
          
          {/* Detailed analysis tabs */}
          <Tabs defaultValue="ai-analysis" className="space-y-4">
            <TabsList>
              <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              <TabsTrigger value="seo-elements">SEO Elements</TabsTrigger>
              <TabsTrigger value="keywords">Keywords</TabsTrigger>
              <TabsTrigger value="extracted-text">Extracted Text</TabsTrigger>
            </TabsList>
            
            <TabsContent value="ai-analysis" className="space-y-4">
              {summary.aiAnalysis ? (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">AI-Powered SEO Analysis</h3>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      Using OpenAI
                    </Badge>
                  </div>
                  
                  <div className="space-y-6">
                    {/* General insights section */}
                    <div>
                      <h4 className="font-medium text-base mb-2">SEO Insights</h4>
                      <div className="bg-slate-50 p-4 rounded-md whitespace-pre-line text-sm">
                        {summary.aiAnalysis.insights}
                      </div>
                    </div>
                    
                    {/* Chart insights if available */}
                    {summary.aiAnalysis.chartInsights && (
                      <div>
                        <h4 className="font-medium text-base mb-2">Chart Analysis</h4>
                        <div className="bg-purple-50 p-4 rounded-md whitespace-pre-line text-sm">
                          {summary.aiAnalysis.chartInsights}
                        </div>
                      </div>
                    )}
                    
                    {/* AI recommendations section */}
                    <div>
                      <h4 className="font-medium text-base mb-2">Priority Recommendations</h4>
                      {summary.aiAnalysis.recommendations && 
                      summary.aiAnalysis.recommendations.length > 0 ? (
                        <div className="space-y-3">
                          {summary.aiAnalysis.recommendations.map((rec: string, index: number) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className="min-w-7 h-7 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 font-medium">
                                {index + 1}
                              </div>
                              <p className="text-sm">{rec}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">
                          No specific recommendations available.
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="p-6">
                  <div className="flex items-center gap-2 text-amber-600 mb-4">
                    <AlertTriangle className="h-5 w-5" />
                    <h3 className="text-lg font-medium">AI Analysis Unavailable</h3>
                  </div>
                  <p className="text-muted-foreground">
                    The AI-powered analysis could not be completed. This could be due to API limitations or connectivity issues.
                  </p>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="recommendations" className="space-y-4">
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4">Improvement Opportunities</h3>
                <div className="space-y-3">
                  {summary.recommendations.length > 0 ? (
                    summary.recommendations.map((recommendation: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <Badge 
                          variant="outline" 
                          className={getRecommendationBadgeColor(index)}
                        >
                          Priority {index + 1}
                        </Badge>
                        <p>{recommendation}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No recommendations found. The document appears to follow most SEO best practices.</p>
                  )}
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="seo-elements" className="space-y-4">
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4">SEO Elements Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">Title Tag</h4>
                      <div className="flex items-center mt-1">
                        <Badge 
                          variant="outline" 
                          className={summary.ratings.titleLengthScore === 'Good' 
                            ? 'bg-green-100 text-green-800' 
                            : summary.ratings.titleLengthScore === 'Missing'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {summary.ratings.titleLengthScore}
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium">H1 Tag</h4>
                      <div className="flex items-center mt-1">
                        <Badge 
                          variant="outline" 
                          className={summary.ratings.h1Score === 'Good' 
                            ? 'bg-green-100 text-green-800' 
                            : summary.ratings.h1Score === 'Missing'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {summary.ratings.h1Score}
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium">Canonical Tag</h4>
                      <div className="flex items-center mt-1">
                        <Badge 
                          variant="outline" 
                          className={summary.ratings.canonicalScore === 'Good' 
                            ? 'bg-green-100 text-green-800' 
                            : summary.ratings.canonicalScore === 'Missing'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {summary.ratings.canonicalScore}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">Robots Directive</h4>
                      <div className="flex items-center mt-1">
                        <Badge 
                          variant="outline" 
                          className={summary.ratings.robotsScore === 'Present' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                          }
                        >
                          {summary.ratings.robotsScore}
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium">Alt Text</h4>
                      <div className="flex items-center mt-1">
                        <Badge 
                          variant="outline" 
                          className={summary.ratings.altTextScore === 'Good' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {summary.ratings.altTextScore}
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium">Meta Tags</h4>
                      <div className="flex items-center mt-1">
                        <Badge 
                          variant="outline" 
                          className="bg-blue-100 text-blue-800"
                        >
                          {summary.elements.metaTags} detected
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="keywords" className="space-y-4">
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4">Keyword Analysis</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Keyword Mentions</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(summary.keywordStats).map(entry => {
                        const [keyword, count] = entry as [string, number];
                        return (
                          <div key={keyword} className="bg-gray-50 rounded p-3">
                            <p className="font-medium text-sm">{keyword}</p>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-xl font-bold">{count}</span>
                              <Badge variant="outline" className="bg-blue-50 text-blue-800">
                                {count > 0 ? 'Found' : 'Not Found'}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Keyword Density</h4>
                    <p className="text-sm text-muted-foreground">
                      The average keyword density in the content is {summary.keywordDensity}. 
                      {parseFloat(summary.keywordDensity) < 1 
                        ? ' This is quite low and could be improved.' 
                        : parseFloat(summary.keywordDensity) > 3
                          ? ' This is relatively high and might risk keyword stuffing.' 
                          : ' This is within a good range for SEO optimization.'}
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="extracted-text" className="space-y-4">
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4">Extracted Text</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <pre className="whitespace-pre-wrap text-sm font-mono">
                    {extractedText || 'No text has been extracted yet.'}
                  </pre>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

// Custom icons that aren't in lucide-react
const LinkIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const KeywordIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="9" y1="9" x2="15" y2="9" />
    <line x1="9" y1="12" x2="15" y2="12" />
    <line x1="9" y1="15" x2="13" y2="15" />
  </svg>
);

export default PdfAnalyzerPage;