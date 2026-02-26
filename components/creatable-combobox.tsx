"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface CreatableComboboxProps {
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  maxItems?: number
  multi?: boolean
}

export function CreatableCombobox({
  options,
  selected,
  onChange,
  placeholder = "Select or type...",
  maxItems,
  multi = true,
}: CreatableComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  const handleSelect = (value: string) => {
    if (multi) {
      if (selected.includes(value)) {
        onChange(selected.filter((s) => s !== value))
      } else if (!maxItems || selected.length < maxItems) {
        onChange([...selected, value])
      }
    } else {
      onChange([value])
      setOpen(false)
    }
    setInputValue("")
  }

  const handleRemove = (value: string) => {
    onChange(selected.filter((s) => s !== value))
  }

  const handleCreateAndSelect = () => {
    const trimmed = inputValue.trim()
    if (!trimmed) return
    if (selected.includes(trimmed)) return
    if (maxItems && selected.length >= maxItems) return
    if (multi) {
      onChange([...selected, trimmed])
    } else {
      onChange([trimmed])
      setOpen(false)
    }
    setInputValue("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      const trimmed = inputValue.trim()
      if (!trimmed) return

      const exactMatch = options.find(
        (o) => o.toLowerCase() === trimmed.toLowerCase()
      )
      if (exactMatch) {
        handleSelect(exactMatch)
      } else {
        handleCreateAndSelect()
      }
    }
  }

  const filteredOptions = options.filter(
    (option) =>
      option.toLowerCase().includes(inputValue.toLowerCase()) &&
      (multi ? !selected.includes(option) : true)
  )

  const showCreateOption =
    inputValue.trim().length > 0 &&
    !options.some(
      (o) => o.toLowerCase() === inputValue.trim().toLowerCase()
    ) &&
    !selected.some(
      (s) => s.toLowerCase() === inputValue.trim().toLowerCase()
    ) &&
    (!maxItems || selected.length < maxItems)

  const isAtMax = maxItems !== undefined && selected.length >= maxItems

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-auto min-h-9 w-full justify-between font-normal text-muted-foreground hover:text-foreground"
          >
            <span className="truncate">
              {!multi && selected.length > 0
                ? selected[0]
                : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <div onKeyDown={handleKeyDown}>
              <CommandInput
                placeholder={isAtMax ? `Max ${maxItems} selected` : "Search or type to create..."}
                value={inputValue}
                onValueChange={setInputValue}
                disabled={isAtMax && multi}
              />
            </div>
            <CommandList>
              <CommandEmpty className="py-3 text-center text-sm text-muted-foreground">
                {isAtMax ? "Maximum items selected" : "No results found. Type and press Enter to create."}
              </CommandEmpty>
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={() => handleSelect(option)}
                    disabled={isAtMax && !selected.includes(option)}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        selected.includes(option) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option}
                  </CommandItem>
                ))}
                {showCreateOption && (
                  <CommandItem
                    value={`create-${inputValue}`}
                    onSelect={handleCreateAndSelect}
                    className="text-primary"
                  >
                    <Plus className="mr-2 size-4" />
                    {`Create "${inputValue.trim()}"`}
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {multi && selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((item) => (
            <Badge
              key={item}
              className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 cursor-default gap-1 rounded-full border px-2.5 py-1 text-xs font-medium"
            >
              {item}
              <button
                type="button"
                className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemove(item)
                }}
                aria-label={`Remove ${item}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
