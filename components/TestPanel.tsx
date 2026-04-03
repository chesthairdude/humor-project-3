"use client"

import { useMemo, useState } from "react"

import { createClient } from "@/utils/supabase/client"

const API_BASE = process.env.NEXT_PUBLIC_CRACKD_API_BASE_URL || "https://api.almostcrackd.ai"

type TestPanelProps = {
  flavorId: string
}

type TestResult = {
  captions?: unknown[]
  [key: string]: unknown
}

type PresignedUploadResponse = {
  presignedUrl: string
  cdnUrl: string
}

type RegisteredImageResponse = {
  imageId: string
  now: number
}

export function TestPanel({ flavorId }: TestPanelProps) {
  const [imageUrl, setImageUrl] = useState("")
  const [testImageFile, setTestImageFile] = useState<File | null>(null)
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<TestResult | null>(null)
  const [error, setError] = useState("")

  const previewUrl = useMemo(() => {
    if (testImageFile) {
      return URL.createObjectURL(testImageFile)
    }

    return imageUrl
  }, [imageUrl, testImageFile])

  async function fileToDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error("Failed to read file."))
      reader.readAsDataURL(file)
    })
  }

  async function parseJsonResponse<T>(response: Response): Promise<T | null> {
    const text = await response.text()
    return text ? (JSON.parse(text) as T) : null
  }

  async function createPipelineImageFromUrl(imageUrl: string, accessToken: string) {
    const response = await fetch(`${API_BASE}/pipeline/upload-image-from-url`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageUrl,
        isCommonUse: false,
      }),
    })

    const data = await parseJsonResponse<RegisteredImageResponse & { message?: string }>(response)

    if (!response.ok || !data?.imageId) {
      throw new Error(data?.message || `API error: ${response.status} ${response.statusText}`)
    }

    return data.imageId
  }

  async function createPipelineImageFromFile(file: File, accessToken: string) {
    const presignedResponse = await fetch(`${API_BASE}/pipeline/generate-presigned-url`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contentType: file.type || "image/jpeg",
      }),
    })

    const presignedData = await parseJsonResponse<PresignedUploadResponse & { message?: string }>(
      presignedResponse
    )

    if (!presignedResponse.ok || !presignedData?.presignedUrl || !presignedData?.cdnUrl) {
      throw new Error(
        presignedData?.message ||
          `API error: ${presignedResponse.status} ${presignedResponse.statusText}`
      )
    }

    const uploadResponse = await fetch(presignedData.presignedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "image/jpeg",
      },
      body: file,
    })

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`)
    }

    return createPipelineImageFromUrl(presignedData.cdnUrl, accessToken)
  }

  async function runTest() {
    if (!imageUrl && !testImageFile) {
      return
    }

    setRunning(true)
    setError("")
    setResults(null)

    try {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error("You must be signed in to generate captions.")
      }

      let imageId = ""

      if (testImageFile) {
        imageId = await createPipelineImageFromFile(testImageFile, session.access_token)
      } else if (imageUrl) {
        imageId = await createPipelineImageFromUrl(imageUrl, session.access_token)
      }

      const response = await fetch(`${API_BASE}/pipeline/generate-captions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          imageId,
          humorFlavorId: Number(flavorId),
        }),
      })

      const data = (await parseJsonResponse<TestResult & { message?: string }>(response)) || {}

      if (!response.ok) {
        throw new Error(
          typeof data.message === "string"
            ? data.message
            : `API error: ${response.status} ${response.statusText}`
        )
      }

      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.")
    } finally {
      setRunning(false)
    }
  }

  const renderedResults =
    results && Array.isArray(results.captions) ? results.captions : results ? [results] : []

  return (
    <div
      className="glass-panel"
      style={{
        padding: 24,
        borderRadius: 24,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div>
        <p className="muted-label" style={{ margin: "0 0 8px" }}>
          Live Test
        </p>
        <h2 style={{ fontSize: 22, margin: 0 }}>Test flavor</h2>
      </div>

      <div>
        <label
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-secondary)",
            display: "block",
            marginBottom: 6,
          }}
        >
          Image URL
        </label>
        <input
          type="text"
          placeholder="https://..."
          value={imageUrl}
          onChange={(event) => {
            setImageUrl(event.target.value)
            if (event.target.value) {
              setTestImageFile(null)
            }
          }}
          style={{ fontSize: 14 }}
        />
      </div>

      <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>or</div>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 80,
          borderRadius: 12,
          border: "2px dashed var(--input-border)",
          background: "var(--input-bg)",
          cursor: "pointer",
          fontSize: 13,
          color: "var(--text-secondary)",
          padding: 14,
          textAlign: "center",
        }}
      >
        {testImageFile ? testImageFile.name : "📎 Upload test image"}
        <input
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(event) => {
            const file = event.target.files?.[0] || null
            setTestImageFile(file)
            if (file) {
              setImageUrl("")
            }
          }}
        />
      </label>

      {previewUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
          src={previewUrl}
          alt="Selected preview"
          style={{
            width: "100%",
            maxHeight: 220,
            objectFit: "contain",
            borderRadius: 10,
            background: "var(--input-bg)",
          }}
          />
        </>
      ) : null}

      <button
        onClick={runTest}
        disabled={running || (!imageUrl && !testImageFile)}
        className={running ? "secondary-button" : "primary-button"}
        style={{
          padding: 14,
          borderRadius: 12,
          fontWeight: 600,
          fontSize: 15,
          cursor: running ? "not-allowed" : "pointer",
          color: running ? "var(--text-muted)" : "#ffffff",
        }}
      >
        {running ? "Generating..." : "Generate captions"}
      </button>

      {running ? (
        <div
          style={{
            height: 4,
            borderRadius: 999,
            background: "var(--input-bg)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: "40%",
              borderRadius: 999,
              background: "var(--button-primary)",
              animation: "shimmer 1.4s ease-in-out infinite",
            }}
          />
        </div>
      ) : null}

      {error ? <div className="danger-banner" style={{ fontSize: 13 }}>{error}</div> : null}

      {renderedResults.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
          <p className="muted-label" style={{ margin: 0 }}>
            Generated Captions
          </p>
          {renderedResults.map((caption, index) => (
            <div
              key={index}
              style={{
                padding: "14px 16px",
                borderRadius: 10,
                background: "var(--input-bg)",
                border: "1px solid var(--border)",
                fontSize: 14,
                color: "var(--text-primary)",
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {typeof caption === "string" ? caption : JSON.stringify(caption, null, 2)}
            </div>
          ))}
        </div>
      ) : null}

      <p style={{ margin: "auto 0 0", fontSize: 12, color: "var(--text-muted)" }}>
        This panel follows the pipeline API flow: register an image, then call
        `/pipeline/generate-captions` with your selected flavor.
      </p>
    </div>
  )
}
