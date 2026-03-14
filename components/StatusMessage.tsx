interface StatusMessageProps {
  loading: boolean;
  error: string | null;
}

export default function StatusMessage({ loading, error }: StatusMessageProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm tracking-widest uppercase">Fetching sheet data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="text-4xl">⚠️</div>
          <p className="text-red-400 text-lg font-medium">{error}</p>
          <p className="text-gray-500 text-sm">Make sure the sheet is publicly shared</p>
        </div>
      </div>
    );
  }

  return null;
}