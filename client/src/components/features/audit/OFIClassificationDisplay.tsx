import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, AlertCircle, Info, Clock, Target, TrendingUp, Shield, Code, HelpCircle } from "lucide-react";
import { AuditItem } from "@shared/schema";

interface OFIClassificationProps {
  item: AuditItem;
  showFullDetails?: boolean;
}

interface OFIClassificationSummaryProps {
  items: AuditItem[];
  sectionName: string;
}

export function OFIClassificationDisplay({ item, showFullDetails = false }: OFIClassificationProps) {
  const isPriorityOFI = item.status === 'Priority OFI';
  const hasClassificationNotes = item.notes?.includes('[OFI Classification]');
  
  if (item.status !== 'OFI' && item.status !== 'Priority OFI') {
    return null;
  }

  const getOFIIcon = () => {
    if (isPriorityOFI) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  };

  const getOFIBadgeColor = () => {
    if (isPriorityOFI) {
      return "bg-red-100 text-red-800 border-red-200 hover:bg-red-200";
    }
    return "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200";
  };

  const extractClassificationInfo = () => {
    if (!hasClassificationNotes || !item.notes) return null;
    
    const classificationMatch = item.notes.match(/\[OFI Classification\](.*?)(?=\n\n|\[|$)/s);
    return classificationMatch ? classificationMatch[1].trim() : null;
  };

  const extractDecisionTree = (classificationInfo: string | null) => {
    if (!classificationInfo) return [];
    
    const lines = classificationInfo.split('\n').filter(line => 
      line.includes('STEP') || line.includes('RESULT:') || line.includes('→')
    );
    return lines;
  };

  const extractCriteriaDetails = (classificationInfo: string | null) => {
    if (!classificationInfo) return [];
    
    const criteriaLines = classificationInfo.split('\n').filter(line => 
      line.includes('✓') || line.includes('✗')
    );
    return criteriaLines;
  };

  const classificationInfo = extractClassificationInfo();
  const decisionTree = extractDecisionTree(classificationInfo);
  const criteriaDetails = extractCriteriaDetails(classificationInfo);

  if (!showFullDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={`${getOFIBadgeColor()} cursor-help`}
            >
              {getOFIIcon()}
              <span className="ml-1">
                {isPriorityOFI ? 'Priority OFI' : 'Standard OFI'}
              </span>
              {hasClassificationNotes && (
                <Info className="h-3 w-3 ml-1" />
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-2">
              <p className="font-medium">
                {isPriorityOFI ? 'Priority OFI' : 'Standard OFI'}
              </p>
              <p className="text-sm text-gray-600">
                {isPriorityOFI 
                  ? 'Critical issue requiring immediate attention (meets ≥2 priority criteria)'
                  : 'Improvement opportunity that would benefit the system'
                }
              </p>
              {hasClassificationNotes && (
                <p className="text-xs text-blue-600">
                  Click for classification details
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {getOFIIcon()}
          OFI Classification Details
          {isPriorityOFI && (
            <Badge variant="destructive">Critical Priority</Badge>
          )}
        </CardTitle>
        <CardDescription>
          {isPriorityOFI 
            ? 'This item meets multiple priority criteria and requires immediate attention'
            : 'This item is classified as a standard improvement opportunity'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasClassificationNotes && classificationInfo && (
          <>
            {/* Classification Summary */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Classification Summary
              </h4>
              <p className="text-sm text-gray-700">
                {isPriorityOFI ? (
                  <>
                    <span className="font-medium text-red-700">Priority OFI:</span> Meets multiple critical criteria requiring immediate action
                  </>
                ) : (
                  <>
                    <span className="font-medium text-yellow-700">Standard OFI:</span> Enhancement opportunity with manageable impact
                  </>
                )}
              </p>
            </div>

            {/* Decision Tree */}
            {decisionTree.length > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Decision Tree Path
                </h4>
                <div className="space-y-1">
                  {decisionTree.map((step, index) => (
                    <div key={index} className="text-sm font-mono bg-white p-2 rounded border">
                      {step.trim()}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Criteria Evaluation */}
            {criteriaDetails.length > 0 && (
              <div className="bg-green-50 p-3 rounded-lg">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Criteria Evaluation
                </h4>
                <div className="space-y-1">
                  {criteriaDetails.map((criteria, index) => (
                    <div key={index} className="text-sm flex items-start gap-2">
                      {criteria.includes('✓') ? (
                        <span className="text-green-600">✓</span>
                      ) : (
                        <span className="text-gray-400">✗</span>
                      )}
                      <span className={criteria.includes('✓') ? 'text-green-700' : 'text-gray-600'}>
                        {criteria.replace('✓', '').replace('✗', '').trim()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Priority Matrix Guidelines */}
            <div className="bg-amber-50 p-3 rounded-lg">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Code className="h-4 w-4" />
                Priority Matrix Guidelines
              </h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>Priority OFI requires ≥2 of:</strong></p>
                <ul className="ml-4 space-y-0.5">
                  <li>• System stability impact (crashes, &gt;50% performance loss, CVSS≥7.0)</li>
                  <li>• User impact severity (&gt;30% users affected, &gt;10 tickets/day)</li>
                  <li>• Business impact (&gt;$10K/day revenue risk, compliance violations)</li>
                  <li>• Technical debt criticality (blocks 3+ initiatives, &gt;25% incident increase)</li>
                </ul>
              </div>
            </div>
          </>
        )}

        {!hasClassificationNotes && (
          <div className="bg-gray-100 p-3 rounded-lg">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Classification applied using legacy logic. Run new classification system for detailed analysis.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function OFIClassificationSummary({ items, sectionName }: OFIClassificationSummaryProps) {
  const priorityOFICount = items.filter(item => item.status === 'Priority OFI').length;
  const standardOFICount = items.filter(item => item.status === 'OFI').length;
  const totalOFICount = priorityOFICount + standardOFICount;
  const totalItems = items.length;

  const priorityOFIRate = totalItems > 0 ? (priorityOFICount / totalItems) * 100 : 0;
  const downgradedCount = items.filter(item => 
    item.notes?.includes('Downgraded from Priority OFI')
  ).length;

  if (totalOFICount === 0) {
    return null;
  }

  const getSeverityColor = () => {
    if (priorityOFIRate > 30) return "text-red-600 bg-red-50";
    if (priorityOFIRate > 15) return "text-orange-600 bg-orange-50";
    return "text-green-600 bg-green-50";
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-5 w-5" />
          OFI Classification Summary - {sectionName}
        </CardTitle>
        <CardDescription>
          Overview of Opportunity for Improvement items and their priority classification
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {priorityOFICount}
            </div>
            <div className="text-sm text-gray-600">Priority OFI</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {standardOFICount}
            </div>
            <div className="text-sm text-gray-600">Standard OFI</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {priorityOFIRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Priority Rate</div>
          </div>
          {downgradedCount > 0 && (
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {downgradedCount}
              </div>
              <div className="text-sm text-gray-600">Downgraded</div>
            </div>
          )}
        </div>

        <div className={`p-3 rounded-lg ${getSeverityColor()}`}>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4" />
            <span className="font-medium text-sm">Classification Health</span>
          </div>
          <p className="text-sm">
            {priorityOFIRate > 30 ? (
              <>Priority OFI rate is high ({priorityOFIRate.toFixed(1)}%). Review classification criteria.</>
            ) : priorityOFIRate > 15 ? (
              <>Moderate Priority OFI rate ({priorityOFIRate.toFixed(1)}%). Monitor for trends.</>
            ) : (
              <>Priority OFI rate is within acceptable range ({priorityOFIRate.toFixed(1)}%).</>
            )}
          </p>
          {downgradedCount > 0 && (
            <p className="text-xs mt-1">
              {downgradedCount} items were downgraded from Priority OFI using new classification criteria.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}