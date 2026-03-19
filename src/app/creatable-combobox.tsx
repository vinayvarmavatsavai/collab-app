"use client"

import * as React from "react"

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
  placeholder = "Add value",
  maxItems,
  multi = true,
}: CreatableComboboxProps) {
  const [inputValue, setInputValue] = React.useState("")

  const canAdd = inputValue.trim().length > 0 && (!maxItems || selected.length < maxItems)

  const addValue = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return

    if (multi) {
      if (selected.includes(trimmed)) return
      if (maxItems && selected.length >= maxItems) return
      onChange([...selected, trimmed])
    } else {
      onChange([trimmed])
    }

    setInputValue("")
  }

  const removeValue = (value: string) => {
    onChange(selected.filter((item) => item !== value))
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <select
          className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
          value=""
          onChange={(e) => {
            if (e.target.value) addValue(e.target.value)
          }}
        >
          <option value="">Select option</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              addValue(inputValue)
            }
          }}
        />
        <button
          type="button"
          onClick={() => addValue(inputValue)}
          disabled={!canAdd}
          className="h-10 rounded-md bg-slate-900 px-3 text-sm text-white disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((item) => (
            <span key={item} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs">
              {item}
              <button type="button" onClick={() => removeValue(item)} className="text-slate-600">
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
