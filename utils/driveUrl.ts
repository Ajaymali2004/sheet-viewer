export function toDirectImageUrl(url: string): string {
  if (!url || url.trim() === "") return "";

  // Already a direct image URL with extension
  if (/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url)) return url;

  // Extract FILE_ID from any drive.google.com format
  let fileId: string | null = null;

  // drive.google.com/open?id=FILE_ID
  const openMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (openMatch) fileId = openMatch[1];

  // drive.google.com/file/d/FILE_ID/view
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) fileId = fileMatch[1];

  // drive.google.com/uc?export=view&id=FILE_ID
  const ucMatch = url.match(/drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/);
  if (ucMatch) fileId = ucMatch[1];

  // drive.google.com/uc?id=FILE_ID&export=view
  const ucMatch2 = url.match(/id=([a-zA-Z0-9_-]+)/);
  if (!fileId && ucMatch2) fileId = ucMatch2[1];

  if (fileId) {
    // This format works directly in <img> tags without CORS issues
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  return url;
}