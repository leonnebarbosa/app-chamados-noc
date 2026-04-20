"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UNIDADES_CAPACIDADE } from "@/lib/constants"

interface CapacityInputProps {
  value: string
  unidade: string
  onValueChange: (valor: string) => void
  onUnidadeChange: (unidade: string) => void
  placeholder?: string
  disabled?: boolean
}

export function CapacityInput({
  value,
  unidade,
  onValueChange,
  onUnidadeChange,
  placeholder = "Ex: 100",
  disabled = false,
}: CapacityInputProps) {
  return (
    <div className="flex gap-2">
      <Input
        type="number"
        min="0"
        step="any"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        disabled={disabled}
        className="flex-1"
      />
      <Select value={unidade} onValueChange={onUnidadeChange} disabled={disabled}>
        <SelectTrigger className="w-[100px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {UNIDADES_CAPACIDADE.map((u) => (
            <SelectItem key={u.value} value={u.value}>
              {u.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}


