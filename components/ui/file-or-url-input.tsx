'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link2, Upload, X, FileText, ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Mode = 'link' | 'upload';

interface FileOrUrlInputProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
}

/**
 * Dual-mode input: users can paste a URL OR upload an image/PDF directly.
 * On mobile, the upload mode opens the rear camera via capture="environment".
 */
export function FileOrUrlInput({
  value,
  onChange,
  disabled,
  placeholder = 'e.g. Google Drive or Dropbox URL',
  id,
}: FileOrUrlInputProps) {
  const [mode, setMode] = useState<Mode>('link');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImageUrl = (url: string) =>
    /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(url);

  const isPdfUrl = (url: string) =>
    /\.pdf(\?.*)?$/i.test(url);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side size guard (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 5 MB.');
      e.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await fetch('/api/upload/vault', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Upload failed. Please try again.');
        return;
      }

      const { url } = await res.json();
      onChange(url);
      setMode('link');
      toast.success('File uploaded successfully!');
    } catch {
      toast.error('Upload failed. Check your connection and try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleClear = () => {
    onChange('');
    setMode('link');
  };

  return (
    <div className="space-y-2">
      {/* Mode toggle */}
      <div className="flex gap-1 p-0.5 bg-muted rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setMode('link')}
          disabled={disabled || uploading}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all',
            mode === 'link'
              ? 'bg-background shadow text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Link2 className="h-3 w-3" />
          Link
        </button>
        <button
          type="button"
          onClick={() => setMode('upload')}
          disabled={disabled || uploading}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all',
            mode === 'upload'
              ? 'bg-background shadow text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Upload className="h-3 w-3" />
          Upload
        </button>
      </div>

      {/* Link mode */}
      {mode === 'link' && (
        <div className="relative flex items-center gap-2">
          <Input
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="pr-8"
          />
          {value && (
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              className="absolute right-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Upload mode */}
      {mode === 'upload' && (
        <div>
          {/* Hidden native file input — capture="environment" opens rear camera on mobile */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
            capture="environment"
            className="sr-only"
            onChange={handleFileChange}
            disabled={disabled || uploading}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className={cn(
              'w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6',
              'transition-colors cursor-pointer',
              'border-border hover:border-primary/50 hover:bg-muted/40',
              (disabled || uploading) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {uploading ? (
              <>
                <Loader2 className="h-7 w-7 text-primary animate-spin" />
                <span className="text-sm text-muted-foreground">Uploading…</span>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ImageIcon className="h-5 w-5" />
                  <FileText className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">Tap to choose or take a photo</span>
                <span className="text-xs text-muted-foreground">JPEG, PNG, WEBP, GIF, PDF · max 5 MB</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Preview strip shown when a value is set (in link mode) */}
      {mode === 'link' && value && (isImageUrl(value) || isPdfUrl(value)) && (
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 rounded-lg border text-xs text-muted-foreground">
          {isImageUrl(value) ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="preview"
                className="h-10 w-10 rounded object-cover border shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <span className="truncate max-w-[200px]">{value.split('/').pop()}</span>
            </>
          ) : (
            <>
              <FileText className="h-5 w-5 shrink-0 text-red-500" />
              <span className="truncate max-w-[200px]">{value.split('/').pop()}</span>
            </>
          )}
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto shrink-0 text-primary hover:underline"
          >
            Open
          </a>
        </div>
      )}
    </div>
  );
}
