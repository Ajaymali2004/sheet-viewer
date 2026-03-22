export function toDirectImageUrl(url: string): string {
  if (!url || url.trim() === "") return "";

  
  if (/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url)) return url;

  
  let fileId: string | null = null;

  
  const openMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (openMatch) fileId = openMatch[1];

  
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) fileId = fileMatch[1];

  
  const ucMatch = url.match(/drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/);
  if (ucMatch) fileId = ucMatch[1];

  
  const ucMatch2 = url.match(/id=([a-zA-Z0-9_-]+)/);
  if (!fileId && ucMatch2) fileId = ucMatch2[1];

  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  return url;
}