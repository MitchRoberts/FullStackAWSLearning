import ScrollShowcase from './components/ScrollShowcase'

function App() {
  return (
    <div className="bg-gray-50">
      {/* Simple header */}
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Bookmark Vault</h1>
          <div className="text-sm text-gray-500">demo</div>
        </div>
      </header>

      {/* Apple-style scroll section */}
      <ScrollShowcase />

      {/* Your functional UI below (list/create) */}
      <main className="mx-auto max-w-5xl px-6 py-16 space-y-8">
        {/* … the list + create form you already built … */}
      </main>
    </div>
  )
}

export default App
