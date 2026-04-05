'use client'
import { useState } from "react"

export const CURRENCY_META: Record<string, { flag: string; name: string }> = {
  GBP: { flag: '🇬🇧', name: 'British Pound' },
  EUR: { flag: '🇪🇺', name: 'Euro' },
  JPY: { flag: '🇯🇵', name: 'Japanese Yen' },
  KRW: { flag: '🇰🇷', name: 'Korean Won' },
  CNY: { flag: '🇨🇳', name: 'Chinese Yuan' },
  USD: { flag: '🇺🇸', name: 'US Dollar' },
}

type Currency = {
  code: string
  name?: string
}

type Props = {
  currencies: Currency[]
  onConfirm: (selected: Currency[]) => void
  onCancel: () => void
}

export const CurrencySelector = ({ currencies, onConfirm, onCancel }: Props) => {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(currencies.map(c => c.code))
  )

  const toggle = (code: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(code) ? next.delete(code) : next.add(code)
      return next
    })
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden my-3">
      {/* header */}
      <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
        <p className="text-sm font-semibold text-zinc-800">Confirm currencies</p>
        <span className="text-xs font-mono text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
          {selected.size}/{currencies.length}
        </span>
      </div>

      {/* list */}
      <div className="divide-y divide-zinc-50">
        {currencies.map(currency => {
          const meta = CURRENCY_META[currency.code]
          const isSelected = selected.has(currency.code)
          return (
            <button
              key={currency.code}
              onClick={() => toggle(currency.code)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors text-left"
            >
              <span className="text-xl shrink-0">{meta?.flag ?? '🏳️'}</span>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-800">{currency.code}</p>
                <p className="text-xs text-zinc-400">{currency.name ?? meta?.name}</p>
              </div>

              {/* toggle pill */}
              <div className={`w-9 h-5 rounded-full transition-colors shrink-0 relative ${
                isSelected ? 'bg-indigo-600' : 'bg-zinc-200'
              }`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${
                  isSelected ? 'left-4.5' : 'left-0.5'
                }`} />
              </div>
            </button>
          )
        })}
      </div>

      {/* actions */}
      <div className="flex gap-2 px-4 py-3 border-t border-zinc-100">
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-xl text-sm font-medium text-zinc-500 hover:bg-zinc-100 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onConfirm(currencies.filter(c => selected.has(c.code)))}
          disabled={selected.size === 0}
          className="flex-1 py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Confirm {selected.size > 0 ? `(${selected.size})` : ''}
        </button>
      </div>
    </div>
  )
}