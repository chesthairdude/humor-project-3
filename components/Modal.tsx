"use client"

import { type ReactNode } from "react"

type ModalProps = {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
}

export function Modal({ open, title, description, onClose, children }: ModalProps) {
  if (!open) {
    return null
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 17, 23, 0.48)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 100,
      }}
    >
      <div
        className="glass-panel"
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "min(560px, 100%)",
          borderRadius: 24,
          padding: 28,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 22,
                lineHeight: 1.1,
                color: "var(--text-primary)",
              }}
            >
              {title}
            </h2>
            {description ? (
              <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--text-secondary)" }}>
                {description}
              </p>
            ) : null}
          </div>

          <button
            onClick={onClose}
            className="secondary-button"
            style={{
              width: 36,
              height: 36,
              padding: 0,
              cursor: "pointer",
              color: "var(--text-secondary)",
            }}
          >
            ×
          </button>
        </div>

        {children}
      </div>
    </div>
  )
}
