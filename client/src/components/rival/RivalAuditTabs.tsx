import { useState } from "react";
import { AlertCircle, BarChart4, FileCheck, FileText, ListChecks, Map, MapPin } from "lucide-react";

interface RivalAuditTabsProps {
  activeTab: string;
  onChange: (tab: string) => void;
}

export default function RivalAuditTabs({ activeTab, onChange }: RivalAuditTabsProps) {
  return (
    <div className="bg-muted/50 w-full mb-6 overflow-x-auto">
      <div className="flex border-b">
        <button 
          onClick={() => onChange("summary")}
          className={`flex items-center gap-1.5 py-2.5 px-4 ${activeTab === "summary" ? "border-b-2 border-primary" : ""}`}
        >
          <BarChart4 className="h-4 w-4" />
          <span>Summary</span>
        </button>
        <button 
          onClick={() => onChange("onpage")}
          className={`flex items-center gap-1.5 py-2.5 px-4 ${activeTab === "onpage" ? "border-b-2 border-primary" : ""}`}
        >
          <FileText className="h-4 w-4" />
          <span>On-Page</span>
        </button>
        <button 
          onClick={() => onChange("structure")}
          className={`flex items-center gap-1.5 py-2.5 px-4 ${activeTab === "structure" ? "border-b-2 border-primary" : ""}`}
        >
          <ListChecks className="h-4 w-4" />
          <span>Structure</span>
        </button>
        <button 
          onClick={() => onChange("contact")}
          className={`flex items-center gap-1.5 py-2.5 px-4 ${activeTab === "contact" ? "border-b-2 border-primary" : ""}`}
        >
          <AlertCircle className="h-4 w-4" />
          <span>Contact</span>
        </button>
        <button 
          onClick={() => onChange("services")}
          className={`flex items-center gap-1.5 py-2.5 px-4 ${activeTab === "services" ? "border-b-2 border-primary" : ""}`}
        >
          <FileCheck className="h-4 w-4" />
          <span>Services</span>
        </button>
        <button 
          onClick={() => onChange("locations")}
          className={`flex items-center gap-1.5 py-2.5 px-4 ${activeTab === "locations" ? "border-b-2 border-primary" : ""}`}
        >
          <MapPin className="h-4 w-4" />
          <span>Locations</span>
        </button>
        <button 
          onClick={() => onChange("service-areas")}
          className={`flex items-center gap-1.5 py-2.5 px-4 ${activeTab === "service-areas" ? "border-b-2 border-primary" : ""}`}
        >
          <Map className="h-4 w-4" />
          <span>Service Areas</span>
        </button>
      </div>
    </div>
  );
}