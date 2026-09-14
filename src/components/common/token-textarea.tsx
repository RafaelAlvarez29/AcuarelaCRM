import { useRef, useState } from "react"

import { cn } from "@/lib/utils"

const TOKEN_PATTERN = /\[(NOMBRE_CLIENTE|NOMBRE_PROYECTO|SALDO_PENDIENTE)\]/g

const TOKENS: { value: string; label: string }[] = [
  { value: "NOMBRE_CLIENTE", label: "Nombre del cliente" },
  { value: "NOMBRE_PROYECTO", label: "Nombre del proyecto" },
  { value: "SALDO_PENDIENTE", label: "Saldo pendiente" },
]

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function renderChipHtml(text: string): string {
  return escapeHtml(text).replace(
    TOKEN_PATTERN,
    (match) =>
      `<span class="inline-block whitespace-nowrap rounded-full bg-primary/15 px-1.5 font-semibold text-primary">${match}</span>`,
  )
}

function getCaretOffset(root: HTMLElement): number {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || !root.contains(selection.anchorNode)) {
    return (root.textContent ?? "").length
  }
  const range = selection.getRangeAt(0)
  const pre = range.cloneRange()
  pre.selectNodeContents(root)
  pre.setEnd(range.endContainer, range.endOffset)
  return pre.toString().length
}

function setCaretByOffset(root: HTMLElement, offset: number) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let remaining = offset
  let current: Node | null = walker.nextNode()
  while (current) {
    const length = (current.textContent ?? "").length
    if (remaining <= length) {
      const range = document.createRange()
      range.setStart(current, remaining)
      range.collapse(true)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
      return
    }
    remaining -= length
    current = walker.nextNode()
  }
  const range = document.createRange()
  range.selectNodeContents(root)
  range.collapse(false)
  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
}

/** Detecta si el caret está escribiendo un token entre [ ] y devuelve su inicio y consulta. */
function detectMention(text: string, caretOffset: number): { start: number; query: string } | null {
  if (caretOffset <= 0) return null
  const before = text.slice(0, caretOffset)
  const start = before.lastIndexOf("[")
  if (start === -1) return null
  const tail = before.slice(start + 1)
  if (tail.includes("]")) return null
  if (!/^[A-Za-z0-9 _-]*$/.test(tail)) return null
  return { start, query: tail }
}

function getCaretRectWithin(container: HTMLElement): { top: number; left: number } {
  const selection = window.getSelection()
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0).cloneRange()
    const rect = range.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    return { top: rect.bottom - containerRect.top, left: rect.left - containerRect.left }
  }
  return { top: 0, left: 0 }
}

interface TokenTextareaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  id?: string
  className?: string
}

interface SuggestionState {
  start: number
  query: string
  top: number
  left: number
}

/** Área de texto editable con chips para tokens [ ] y sugerencias al escribir "[". */
export function TokenTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  id,
  className,
}: TokenTextareaProps) {
  const ref = useRef<HTMLDivElement>(null)
  const lastRenderedRef = useRef(value)
  const lastMentionKeyRef = useRef("")
  const [focused, setFocused] = useState(false)
  const [suggest, setSuggest] = useState<SuggestionState | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const setRootElement = (el: HTMLDivElement | null) => {
    if (el && ref.current !== el) {
      ref.current = el
      el.innerHTML = renderChipHtml(value)
      lastRenderedRef.current = value
    }
  }

  const refreshSuggestions = () => {
    const el = ref.current
    if (!el) return
    const text = el.textContent ?? ""
    const caret = getCaretOffset(el)
    const found = detectMention(text, caret)
    if (found) {
      const key = `${found.start}:${found.query}`
      if (key !== lastMentionKeyRef.current) {
        lastMentionKeyRef.current = key
        setActiveIndex(0)
      }
      const { top, left } = getCaretRectWithin(el)
      setSuggest({ ...found, top, left })
    } else {
      lastMentionKeyRef.current = ""
      setSuggest(null)
    }
  }

  const handleInput = () => {
    const el = ref.current
    if (!el) return
    const text = el.textContent ?? ""
    if (text === lastRenderedRef.current) return
    const offset = getCaretOffset(el)
    onChange(text)
    el.innerHTML = renderChipHtml(text)
    lastRenderedRef.current = text
    setCaretByOffset(el, offset)
    refreshSuggestions()
  }

  const applyMention = (token: string) => {
    const el = ref.current
    if (!el || !suggest) return
    const text = el.textContent ?? ""
    const caret = getCaretOffset(el)
    const inserted = `[${token}]`
    const next = text.slice(0, suggest.start) + inserted + text.slice(caret)
    const insertionEnd = suggest.start + inserted.length
    onChange(next)
    el.innerHTML = renderChipHtml(next)
    lastRenderedRef.current = next
    setCaretByOffset(el, insertionEnd)
    setSuggest(null)
    setActiveIndex(0)
    el.focus()
  }

  const matches = suggest
    ? TOKENS.filter((t) => {
        const q = suggest.query.trim().toLowerCase()
        return q ? t.value.toLowerCase().includes(q) : true
      })
    : []
  const showSuggestions = focused && suggest !== null && matches.length > 0

  return (
    <div className="relative">
      <div
        ref={setRootElement}
        id={id}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-expanded={showSuggestions}
        onInput={handleInput}
        onClick={refreshSuggestions}
        onKeyUp={refreshSuggestions}
        onKeyDown={(e) => {
          if (showSuggestions) {
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setActiveIndex((i) => (i + 1) % matches.length)
              return
            }
            if (e.key === "ArrowUp") {
              e.preventDefault()
              setActiveIndex((i) => (i - 1 + matches.length) % matches.length)
              return
            }
            if (e.key === "Enter" || e.key === "Tab") {
              e.preventDefault()
              applyMention(matches[activeIndex]!.value)
              return
            }
            if (e.key === "Escape") {
              e.preventDefault()
              setSuggest(null)
              return
            }
          }
          if (e.key === "Enter") {
            e.preventDefault()
            const inserted = document.execCommand("insertLineBreak")
            if (!inserted) document.execCommand("insertHTML", false, "<br/>")
          }
        }}
        onFocus={() => {
          setFocused(true)
          refreshSuggestions()
        }}
        onBlur={() => setFocused(false)}
        className={cn(
          "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full cursor-text break-words rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] md:text-sm",
          className,
        )}
        style={{ minHeight: `${rows * 24 + 8}px`, whiteSpace: "pre-wrap" }}
      />
      {!value.trim() && !focused && (
        <span className="pointer-events-none absolute left-3 top-2 text-base text-muted-foreground md:text-sm">
          {placeholder}
        </span>
      )}
      {showSuggestions && (
        <div
          role="listbox"
          className="absolute z-10 w-64 overflow-hidden rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg"
          style={{ top: suggest.top + 4, left: Math.max(0, suggest.left) }}
        >
          {matches.map((t, i) => (
            <button
              key={t.value}
              type="button"
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyMention(t.value)}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm",
                i === activeIndex ? "bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              <span className="font-semibold">[{t.value}]</span>
              <span className={cn("text-xs", i === activeIndex ? "text-primary-foreground/80" : "text-muted-foreground")}>
                {t.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}