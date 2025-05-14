import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

interface ComboboxProps {
  options: { value: string; label: string; id?: string }[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select an option",
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  
  const filteredOptions = React.useMemo(() => {
    if (!searchTerm) return options;
    
    const normalizedSearchTerm = searchTerm.toLowerCase().trim();
    
    // More comprehensive search that handles partial matches better
    return options.filter(option => {
      const normalizedLabel = option.label.toLowerCase();
      
      // Check if the search term is in the label
      if (normalizedLabel.includes(normalizedSearchTerm)) {
        return true;
      }
      
      // Check if individual words in the search term match
      const searchWords = normalizedSearchTerm.split(/\s+/);
      return searchWords.every(word => normalizedLabel.includes(word));
    });
  }, [searchTerm, options]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between transition-all duration-300 hover:border-primary/50 bg-white"
        >
          {value
            ? options.find((option) => option.value === value)?.label
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 max-h-[40vh] overflow-auto" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={`Search ${placeholder.toLowerCase()}...`} 
            className="h-9"
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandEmpty className="py-3 text-center text-sm">
            No options found.
          </CommandEmpty>
          
          {filteredOptions.length > 0 && (
            <div className="max-h-[300px] overflow-auto">
              {/* Group cities by state */}
              {(() => {
                // Group options by state
                const stateGroups = filteredOptions.reduce((groups, option) => {
                  // Extract state from the option value
                  const state = option.value.includes(",") 
                    ? option.value.split(",")[1]?.trim() 
                    : "Other";
                  
                  if (!groups[state]) {
                    groups[state] = [];
                  }
                  
                  groups[state].push(option);
                  return groups;
                }, {} as Record<string, typeof filteredOptions>);
                
                // Convert groups to array and sort by state name
                return Object.entries(stateGroups)
                  .sort(([stateA], [stateB]) => stateA.localeCompare(stateB))
                  .map(([state, options]) => (
                    <CommandGroup key={state} heading={state} className="mb-2">
                      {options.map((option) => (
                        <CommandItem
                          key={option.id || `${option.value}-${Math.random()}`}
                          value={option.value}
                          onSelect={(currentValue) => {
                            onChange(currentValue);
                            setOpen(false);
                            setSearchTerm("");
                          }}
                          className="cursor-pointer transition-colors hover:bg-muted/60"
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <Check
                                className={cn(
                                  "h-4 w-4",
                                  value === option.value ? "opacity-100 text-primary" : "opacity-0"
                                )}
                              />
                              <span>{option.value.split(",")[0]}</span>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ));
              })()}
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}