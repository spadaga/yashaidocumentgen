import DebugProviders from "../debug-providers"

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Debug Page</h1>
        <DebugProviders />
      </div>
    </div>
  )
}
