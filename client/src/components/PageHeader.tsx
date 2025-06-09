import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  icon,
  actions,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
      <div className="flex items-center gap-3">
        {icon && 
          <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary text-primary-foreground">
            {icon}
          </div>
        }
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground mt-1">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex-shrink-0 mt-4 md:mt-0">{actions}</div>}
    </div>
  );
};

export default PageHeader;
export { PageHeader };