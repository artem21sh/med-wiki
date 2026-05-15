export default function Loading() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-8" />
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="bg-gray-200 rounded-xl h-48 animate-pulse mb-4" />
        <div className="flex flex-col gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-xl h-14 animate-pulse" />
          ))}
        </div>
      </div>
    </main>
  );
}
