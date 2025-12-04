import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-6">
          ✨ Workflows Builder
        </h1>
        <p className="text-xl mb-8 text-gray-600">
          Transforma tus procesos en flujos de trabajo accionables
        </p>
        <Link
          href="/processes"
          className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Ir a Procesos
        </Link>
      </div>
    </main>
  )
}

