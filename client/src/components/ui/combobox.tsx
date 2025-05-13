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
  options: { value: string; label: string }[]
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
    return options.filter(option => 
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
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
            <CommandGroup heading="Options" className="max-h-[300px] overflow-auto">
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
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
                      <span>{option.label}</span>
                    </div>
                    
                    {option.value.includes(",") && (
                      <Badge variant="outline" className="text-xs py-0 px-1.5 bg-primary/5">
                        {option.value.split(",")[1]?.trim()}
                      </Badge>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}