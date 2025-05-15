import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, FileText, Upload, X, AlertTriangle, Download, File, Image, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      const totalPages = pdf.numPages;
      
      for (let i = 1; i <= totalPages; i++) {
        // Update progress
        setProgress(Math.floor((i / totalPages) * 50));
        
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n';
      }
      
      return fullText;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  };

  // Extract text from image
  const extractTextFromImage = async (file: File): Promise<string> => {
    try {
      const result = await Tesseract.recognize(file, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.floor(m.progress * 50));
          }
        },
      });
      
      return result.data.text;
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

    // Prepare regex patterns for common SEO terms
    const metaTagPattern = /meta\s*(name|property|http-equiv)=["']([^"']+)["']/gi;
    const h1Pattern = /<h1[^>]*>(.*?)<\/h1>/gi;
    const linkPattern = /<a\s+(?:[^>]*?\s+)?href=["']([^"']*)["']/gi;
    const imgPattern = /<img\s+[^>]*?src=["']([^"']*)["'][^>]*?>/gi;
    const titlePattern = /<title[^>]*>(.*?)<\/title>/gi;
    const canonicalPattern = /<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/gi;
    const robotsPattern = /<meta\s+name=["']robots["']\s+content=["']([^"']*)["']/gi;
    const keywordMentions = (text: string): { [key: string]: number } => {
      const keywords = ['seo', 'search engine', 'keyword', 'backlink', 'ranking', 'meta description', 'title tag', 'alt text', 'canonical', 'robots'];
      return keywords.reduce((acc, keyword) => {
        const pattern = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = text.match(pattern);
        acc[keyword] = matches ? matches.length : 0;
        return acc;
      }, {} as { [key: string]: number });
    };

    // Extract key SEO elements
    const metaTags = [...text.matchAll(metaTagPattern)].map(match => match[0]);
    const h1Tags = [...text.matchAll(h1Pattern)].map(match => match[1]);
    const links = [...text.matchAll(linkPattern)].map(match => match[1]);
    const images = [...text.matchAll(imgPattern)].map(match => match[0]);
    const titles = [...text.matchAll(titlePattern)].map(match => match[1]);
    const canonicals = [...text.matchAll(canonicalPattern)].map(match => match[1]);
    const robots = [...text.matchAll(robotsPattern)].map(match => match[1]);
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
    
    try {
      let text = '';
      if (fileType === 'pdf') {
        text = await extractTextFromPdf(file);
      } else if (fileType === 'image') {
        text = await extractTextFromImage(file);
      }
      
      setExtractedText(text);
      
      // Analyze the text
      const analysisSummary = analyzeText(text);
      setSummary(analysisSummary);
      
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
                      <Image className="h-16 w-16 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {fileType === 'pdf' ? 'PDF Document' : 'Image File'}
                    </p>
                  </div>
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
          
          {/* Progress and errors */}
          {isProcessing && (
            <Card className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">Processing document...</p>
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
          
          {/* Detailed analysis tabs */}
          <Tabs defaultValue="recommendations" className="space-y-4">
            <TabsList>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              <TabsTrigger value="seo-elements">SEO Elements</TabsTrigger>
              <TabsTrigger value="keywords">Keywords</TabsTrigger>
              <TabsTrigger value="extracted-text">Extracted Text</TabsTrigger>
            </TabsList>
            
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
                      {Object.entries(summary.keywordStats).map(([keyword, count]: [string, number]) => (
                        <div key={keyword} className="bg-gray-50 rounded p-3">
                          <p className="font-medium text-sm">{keyword}</p>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xl font-bold">{count}</span>
                            <Badge variant="outline" className="bg-blue-50 text-blue-800">
                              {count > 0 ? 'Found' : 'Not Found'}
                            </Badge>
                          </div>
                        </div>
                      ))}
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