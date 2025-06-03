"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAvailableProviders } from "./actions"

export default function DebugProviders() {
  const [providers, setProviders] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [environment, setEnvironment] = useState<string>("")

  const checkProviders = async () => {
    setLoading(true)
    try {
      const availableProviders = await getAvailableProviders()
      setProviders(availableProviders)

      // Check environment
      const isLocal =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1" ||
          window.location.hostname.includes("localhost"))

      setEnvironment(isLocal ? "Local Development" : "Production (Vercel)")
    } catch (error) {
      console.error("Error checking providers:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>🔍 Provider Debug Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={checkProviders} disabled={loading}>
          {loading ? "Checking..." : "Check Available Providers"}
        </Button>

        {environment && (
          <div className="p-3 bg-blue-50 rounded">
            <strong>Environment:</strong> {environment}
          </div>
        )}

        {providers.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Available Providers ({providers.length}):</h3>
            <ul className="list-disc list-inside space-y-1">
              {providers.map((provider) => (
                <li key={provider} className="text-sm">
                  {provider.toUpperCase()}
                </li>
              ))}
            </ul>
          </div>
        )}

        {providers.length === 0 && !loading && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <strong>⚠️ No providers available!</strong>
            <p className="text-sm mt-1">This means no API keys are configured in the environment variables.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
