import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Loader2, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateContractPDFBlob, ContractPDFData } from "@/lib/pdf-utils";

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfData: ContractPDFData;
  filename: string;
}

export function PDFPreviewModal({ isOpen, onClose, pdfData, filename }: PDFPreviewModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    if (isOpen) {
      generatePreview();
    }
    
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [isOpen]);

  const generatePreview = async () => {
    setIsLoading(true);
    try {
      const blob = await generateContractPDFBlob(pdfData);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error("PDF preview error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!pdfUrl) return;
    
    setIsDownloading(true);
    try {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleResetZoom = () => setZoom(100);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="fixed inset-4 md:inset-8 bg-card rounded-2xl overflow-hidden flex flex-col shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-foreground">PDF 미리보기</h2>
              <span className="text-sm text-muted-foreground hidden md:inline">
                {filename}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="hidden md:flex items-center gap-1 mr-2 bg-background rounded-lg px-2 py-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground w-12 text-center">{zoom}%</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleZoomIn}
                  disabled={zoom >= 200}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleResetZoom}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>

              <Button
                onClick={handleDownload}
                disabled={isLoading || isDownloading}
                className="gap-2"
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span className="hidden md:inline">다운로드</span>
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-10 w-10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* PDF Viewer */}
          <div className="flex-1 overflow-auto bg-muted/50 p-4 md:p-8">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-muted-foreground">PDF 생성 중...</p>
                </div>
              </div>
            ) : pdfUrl ? (
              <div className="flex justify-center">
                <iframe
                  src={pdfUrl}
                  className="bg-white shadow-lg rounded-lg"
                  style={{
                    width: `${(210 * zoom) / 100}mm`,
                    height: `${(297 * zoom) / 100}mm`,
                    maxWidth: '100%',
                    minHeight: '70vh',
                  }}
                  title="PDF Preview"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">PDF를 불러올 수 없습니다</p>
              </div>
            )}
          </div>

          {/* Mobile Download Button */}
          <div className="md:hidden p-4 border-t border-border bg-background">
            <Button
              onClick={handleDownload}
              disabled={isLoading || isDownloading}
              className="w-full gap-2"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              PDF 다운로드
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
