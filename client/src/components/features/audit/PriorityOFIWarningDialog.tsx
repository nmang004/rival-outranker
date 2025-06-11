import { useState } from "react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface PriorityOFIWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (justification: string) => void;
  currentStats: {
    priorityOFIPercentage: number;
    totalPriorityOFI: number;
    totalItems: number;
  };
  itemName: string;
}

export function PriorityOFIWarningDialog({
  open,
  onOpenChange,
  onConfirm,
  currentStats,
  itemName
}: PriorityOFIWarningDialogProps) {
  const [justification, setJustification] = useState("");
  const [checkedCriteria, setCheckedCriteria] = useState({
    seoVisibility: false,
    userExperience: false,
    businessImpact: false,
    complianceRisk: false
  });

  const checkedCount = Object.values(checkedCriteria).filter(Boolean).length;
  const canConfirm = checkedCount >= 2 && justification.length > 20;

  const handleConfirm = () => {
    if (canConfirm) {
      const criteriaList = Object.entries(checkedCriteria)
        .filter(([_, checked]) => checked)
        .map(([criteria]) => criteria)
        .join(", ");
      
      const fullJustification = `Criteria met: ${criteriaList}. ${justification}`;
      onConfirm(fullJustification);
      
      // Reset form
      setJustification("");
      setCheckedCriteria({
        seoVisibility: false,
        userExperience: false,
        businessImpact: false,
        complianceRisk: false
      });
    }
  };

  const isHighRate = currentStats.priorityOFIPercentage > 30;
  const isWarningRate = currentStats.priorityOFIPercentage > 15;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Priority OFI Classification Warning
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="font-medium text-amber-900">Current Classification Stats</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-2xl font-bold text-amber-900">
                    {currentStats.priorityOFIPercentage.toFixed(1)}%
                  </div>
                  <div className="text-amber-700">Priority OFI Rate</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-900">
                    {currentStats.totalPriorityOFI}
                  </div>
                  <div className="text-amber-700">Total Priority OFI</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-900">
                    &lt;10%
                  </div>
                  <div className="text-amber-700">Target Rate</div>
                </div>
              </div>
              {isHighRate && (
                <div className="mt-3 text-sm text-red-700 font-medium">
                  ⚠️ Priority OFI rate is critically high! Target is &lt;10%.
                </div>
              )}
              {!isHighRate && isWarningRate && (
                <div className="mt-3 text-sm text-amber-700">
                  Priority OFI rate is above target. Consider if this truly requires immediate action.
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">
                Confirm Priority OFI Criteria for "{itemName}"
              </Label>
              <div className="text-sm text-gray-600 mb-2">
                Priority OFI should ONLY be assigned when AT LEAST 2 of these criteria are met:
              </div>
              
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="seoVisibility"
                    checked={checkedCriteria.seoVisibility}
                    onCheckedChange={(checked) => 
                      setCheckedCriteria(prev => ({ ...prev, seoVisibility: checked as boolean }))
                    }
                  />
                  <div className="space-y-1">
                    <label htmlFor="seoVisibility" className="text-sm font-medium cursor-pointer">
                      SEO Visibility Impact
                    </label>
                    <p className="text-xs text-gray-600">
                      Missing meta titles/descriptions, Core Web Vitals failures, indexing blocks
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="userExperience"
                    checked={checkedCriteria.userExperience}
                    onCheckedChange={(checked) => 
                      setCheckedCriteria(prev => ({ ...prev, userExperience: checked as boolean }))
                    }
                  />
                  <div className="space-y-1">
                    <label htmlFor="userExperience" className="text-sm font-medium cursor-pointer">
                      User Experience Impact
                    </label>
                    <p className="text-xs text-gray-600">
                      Broken navigation/forms, unreadable content, non-functional site features
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="businessImpact"
                    checked={checkedCriteria.businessImpact}
                    onCheckedChange={(checked) => 
                      setCheckedCriteria(prev => ({ ...prev, businessImpact: checked as boolean }))
                    }
                  />
                  <div className="space-y-1">
                    <label htmlFor="businessImpact" className="text-sm font-medium cursor-pointer">
                      Business Impact
                    </label>
                    <p className="text-xs text-gray-600">
                      SEO ranking drops, missing conversion opportunities, brand credibility issues
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="complianceRisk"
                    checked={checkedCriteria.complianceRisk}
                    onCheckedChange={(checked) => 
                      setCheckedCriteria(prev => ({ ...prev, complianceRisk: checked as boolean }))
                    }
                  />
                  <div className="space-y-1">
                    <label htmlFor="complianceRisk" className="text-sm font-medium cursor-pointer">
                      Compliance Risk
                    </label>
                    <p className="text-xs text-gray-600">
                      GDPR violations, accessibility issues, security non-compliance, missing HTTPS
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                {checkedCount < 2 ? (
                  <>
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-700">
                      Must select at least 2 criteria ({checkedCount}/2 selected)
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-700">
                      {checkedCount} criteria selected - Priority OFI justified
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="justification">
                Provide detailed justification <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="justification"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Explain why this requires immediate action and the specific impact..."
                className="min-h-[100px]"
              />
              <p className="text-xs text-gray-600">
                Minimum 20 characters required. Include quantifiable metrics where possible.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Remember:</strong> Priority OFI should be EXCEPTIONAL, not the norm. 
                When in doubt, choose Standard OFI.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={canConfirm ? "bg-red-600 hover:bg-red-700" : ""}
          >
            Confirm Priority OFI
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}