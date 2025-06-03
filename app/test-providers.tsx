"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2, Zap, AlertTriangle } from "lucide-react"
import { getAvailableProviders } from "./actions"
import { PROVIDER_MODELS, PROVIDER_INFO } from "@/lib/providers"

interface ProviderStatus {
  name: string
  available: boolean
  modelCount: number
  info: any
  tested?: boolean
  working?: boolean
  error?: string
}

export default function ProviderTestPage() {
  const [providers, setProviders] = useState<ProviderStatus[]>([])
  const [testing, setTesting] = useState(false)
  const [testResults, setTestResults] = useState<Record<string, boolean>>({})

  const checkProviders = async () => {
    setTesting(true)
    try {
      const availableProviders = await getAvailableProviders()

      const allProviders = Object.keys(PROVIDER_MODELS).map((providerName) => ({
        name: providerName,
        available: availableProviders.includes(providerName),
        modelCount: PROVIDER_MODELS[providerName as keyof typeof PROVIDER_MODELS]?.length || 0,
        info: PROVIDER_INFO[providerName as keyof typeof PROVIDER_INFO],
      }))

      setProviders(allProviders)
    } catch (error) {
      console.error("Error checking providers:", error)
    } finally {
      setTesting(false)
    }
  }

  const testProvider = async (providerName: string) => {
    // This would be a simple test call to each provider
    // For now, we'll simulate the test
    setTestResults((prev) => ({ ...prev, [providerName]: Math.random() > 0.2 }))
  }

  const availableCount = providers.filter((p) => p.available).length
  const totalModels = providers.reduce((sum, p) => sum + (p.available ? p.modelCount : 0), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Zap className="h-8 w-8 text-green-600" />
            AI Provider Status Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Test and monitor all {Object.keys(PROVIDER_MODELS).length} AI providers and{" "}
            {Object.values(PROVIDER_MODELS).flat().length}+ models
          </p>
        </div>

        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Provider Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{availableCount}</div>
                <div className="text-sm text-gray-600">Available Providers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalModels}</div>
                <div className="text-sm text-gray-600">Total Models</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {providers.filter((p) => p.info?.integrated).length}
                </div>
                <div className="text-sm text-gray-600">Vercel Integrated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Object.keys(PROVIDER_MODELS).length - availableCount}
                </div>
                <div className="text-sm text-gray-600">Missing Keys</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Button */}
        <div className="text-center">
          <Button onClick={checkProviders} disabled={testing} size="lg">
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Checking Providers...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Check All Providers
              </>
            )}
          </Button>
        </div>

        {/* Provider Grid */}
        {providers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((provider) => (
              <Card
                key={provider.name}
                className={`${provider.available ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {provider.available ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      {provider.info?.name || provider.name.charAt(0).toUpperCase() + provider.name.slice(1)}
                    </CardTitle>
                    {provider.info?.integrated && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        Vercel
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{provider.info?.description || `${provider.name} AI provider`}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Models Available:</span>
                      <Badge variant={provider.available ? "default" : "secondary"}>
                        {provider.available ? provider.modelCount : 0} models
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">API Key:</span>
                      <Badge variant={provider.available ? "default" : "destructive"}>
                        {provider.available ? "✓ Configured" : "✗ Missing"}
                      </Badge>
                    </div>

                    {provider.info?.website && (
                      <div className="text-xs text-gray-500">Website: {provider.info.website}</div>
                    )}

                    {provider.available && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testProvider(provider.name)}
                        className="w-full"
                      >
                        Test Connection
                      </Button>
                    )}

                    {!provider.available && (
                      <div className="flex items-center gap-1 text-xs text-red-600">
                        <AlertTriangle className="h-3 w-3" />
                        Add {provider.name.toUpperCase()}_API_KEY to environment
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>🚀 Ready to Generate Documentation!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-700">
                Your AI Documentation Generator now supports <strong>{availableCount} providers</strong> with{" "}
                <strong>{totalModels} models</strong>. You can now:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Generate documentation using any available provider</li>
                <li>Compare quality and speed across different models</li>
                <li>Use "All Providers" mode for comprehensive comparison</li>
                <li>Leverage Groq's Vercel integration for fastest results</li>
                <li>Access specialized models like Perplexity's web-search capabilities</li>
              </ul>
              <div className="mt-4">
                <Button asChild>
                  <a href="/">Go to Documentation Generator</a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
