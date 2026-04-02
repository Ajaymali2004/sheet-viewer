export default function ErrorCard({
  icon,
  title,
  message,
}: {
  icon: string;
  title: string;
  message: string | null;
}) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="text-4xl">{icon}</div>
        <p className="text-red-400 text-lg font-medium">{title}</p>
        <p className="text-gray-500 text-sm max-w-sm">{message}</p>
      </div>
    </div>
  );
}