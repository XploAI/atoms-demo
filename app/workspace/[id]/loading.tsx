export default function WorkspaceLoading() {
  return (
    <div className="flex h-screen flex-col bg-zinc-950">
      <div className="h-12 border-b border-zinc-900 bg-zinc-950/60" />
      <div className="grid flex-1 grid-cols-1 md:grid-cols-[40%_1fr]">
        <div className="border-r border-zinc-900 p-6">
          <div className="space-y-3">
            <div className="shimmer h-3 w-1/3 rounded" />
            <div className="shimmer h-3 w-2/3 rounded" />
            <div className="shimmer h-3 w-1/2 rounded" />
          </div>
        </div>
        <div className="grid place-items-center text-xs text-zinc-700">
          Loading workspace…
        </div>
      </div>
    </div>
  );
}
