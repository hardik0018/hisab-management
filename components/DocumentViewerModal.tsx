'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, ExternalLink, Download, FileText, Image as ImageIcon, Loader2, AlertCircle, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
}

export function DocumentViewerModal({
  isOpen,
  onClose,
  title,
  url,
}: DocumentViewerModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Extract real file extension from direct URL or /api/vault/view?url=...
  const { isImage, isPdf, isExternalWebPage, hostName } = useMemo(() => {
    if (!url) return { isImage: false, isPdf: false, isExternalWebPage: false, hostName: '' };

    let cleanTarget = url;
    let targetHost = '';

    try {
      if (url.startsWith('/api/vault/view') && url.includes('url=')) {
        const parsed = new URL(url, 'http://localhost');
        cleanTarget = parsed.searchParams.get('url') || url;
      } else if (url.startsWith('http://') || url.startsWith('https://')) {
        const parsed = new URL(url);
        targetHost = parsed.hostname;
      }
    } catch {
      cleanTarget = url;
    }

    const lower = cleanTarget.toLowerCase();
    const isImg = /\.(jpg|jpeg|png|webp|gif|svg|avif)(\?.*)?$/i.test(lower);
    const isDocPdf = /\.pdf(\?.*)?$/i.test(lower);
    const isExternal = !url.startsWith('/api/vault/view') && !isImg && !isDocPdf;

    return {
      isImage: isImg,
      isPdf: isDocPdf,
      isExternalWebPage: isExternal,
      hostName: targetHost,
    };
  }, [url]);

  // Handle hardware / gesture back button
  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    setHasError(false);

    // Auto-dismiss loading overlay after 1s for fast UI responsiveness
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    if (typeof window !== 'undefined') {
      window.history.pushState({ modal: 'doc-viewer' }, '');
    }

    const handlePopState = () => {
      onClose();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, onClose]);

  const handleDismiss = () => {
    // Immediately close modal
    onClose();
    // Pop the pushed history state if active
    if (typeof window !== 'undefined' && window.history.state?.modal === 'doc-viewer') {
      window.history.back();
    }
  };

  if (!isOpen || !url) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleDismiss(); }}>
      <DialogContent
        className="w-[100vw] h-[100dvh] sm:w-[95vw] sm:h-[95vh] max-w-6xl flex flex-col p-0 overflow-hidden border-none sm:rounded-[2rem] shadow-2xl"
        style={{ background: 'var(--background)' }}
      >
        {/* Header Bar */}
        <div
          className="p-3.5 sm:p-4 pr-12 flex items-center justify-between gap-3 shrink-0 border-b relative z-10"
          style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={handleDismiss}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-black/5 active:scale-95 shrink-0 cursor-pointer"
              style={{ color: 'var(--foreground)' }}
              title="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <DialogTitle className="text-sm sm:text-base font-bold truncate leading-tight" style={{ color: 'var(--foreground)' }}>
                {title || 'Document Preview'}
              </DialogTitle>
              <p className="text-[10px] truncate font-medium" style={{ color: 'var(--muted-foreground)' }}>
                {isImage ? 'Image document' : isPdf ? 'PDF document' : hostName ? `Cloud link (${hostName})` : 'Attached document'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
              style={{ background: 'var(--primary)', color: 'white' }}
              title="Open full document"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Open</span>
            </a>
          </div>
        </div>

        {/* Document Content Area */}
        <div className="flex-1 relative overflow-hidden bg-black/5 flex flex-col items-center justify-center sm:p-2">
          {isLoading && !isExternalWebPage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/60 backdrop-blur-xs z-10 pointer-events-none">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <span className="text-xs font-semibold text-muted-foreground">Loading preview...</span>
            </div>
          )}

          {isExternalWebPage ? (
            <div className="text-center p-6 space-y-4 max-w-md mx-auto card-surface rounded-2xl p-6 border shadow-sm" style={{ borderColor: 'var(--border)' }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base font-bold mb-1" style={{ color: 'var(--foreground)' }}>
                  External Cloud Document
                </p>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {hostName ? `Hosted on ${hostName}.` : 'Hosted on an external provider.'} Cloud storage security policies require opening external links directly.
                </p>
              </div>
              <Button asChild className="w-full rounded-xl font-bold h-11">
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" /> Open on {hostName || 'Web'}
                </a>
              </Button>
            </div>
          ) : hasError ? (
            <div className="text-center p-6 space-y-3 max-w-sm mx-auto">
              <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
              <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
                Preview not directly available
              </p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                You can view or download this document directly.
              </p>
              <Button asChild size="sm" className="rounded-xl">
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1.5" /> Open in Browser
                </a>
              </Button>
            </div>
          ) : isImage ? (
            <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={title}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setHasError(true);
                }}
                className="max-h-full max-w-full object-contain rounded-xl shadow-md transition-all"
              />
            </div>
          ) : isPdf ? (
            <div className="w-full h-full flex flex-col bg-white">
              <object
                data={url}
                type="application/pdf"
                className="w-full h-full rounded-none sm:rounded-xl border-0 shadow-inner"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setHasError(true);
                }}
              >
                <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
                  <AlertCircle className="h-10 w-10 text-amber-500" />
                  <p className="text-sm font-bold">Browser cannot display PDF directly.</p>
                  <Button asChild size="sm" className="rounded-xl">
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1.5" /> Download / Open PDF
                    </a>
                  </Button>
                </div>
              </object>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col">
              <iframe
                src={url}
                title={title}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setHasError(true);
                }}
                className="w-full h-full rounded-none sm:rounded-xl border-0 bg-white shadow-inner"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
