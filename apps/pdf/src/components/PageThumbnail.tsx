'use client';
import React, { useRef, useEffect, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Card, CloseButton, Spinner } from 'react-bootstrap';
import { ItemTypes } from '../constants';
import type { PageData } from '../types';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import type { DragSourceMonitor, DropTargetMonitor } from 'react-dnd';
import { PdfPageEditor } from './PdfPageEditor';
import * as fabric from 'fabric';

// Initialize PDF.js worker
const PDFJS_VERSION = pdfjsLib.version;
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.mjs`;

interface PageThumbnailProps {
  id: string;
  index: number;
  pageData: PageData;
  movePage: (dragIndex: number, hoverIndex: number) => void;
  renderPage: (canvas: HTMLCanvasElement | null, pageData: PageData) => Promise<void>;
}

export const PageThumbnail: React.FC<PageThumbnailProps> = ({ id, index, pageData, movePage, renderPage }) => {
  const ref = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);
  const pageRef = useRef<PDFPageProxy | null>(null);
  const renderTaskRef = useRef<AbortController | null>(null);

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.PAGE,
    item: () => ({ id, index }),
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop<{ id: string; index: number }>({
    accept: ItemTypes.PAGE,
    hover(item, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      movePage(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const cleanupResources = async () => {
    try {
      renderTaskRef.current?.abort();
      renderTaskRef.current = null;

      if (pageRef.current) {
        await pageRef.current.cleanup();
        pageRef.current = null;
      }
      if (pdfDocRef.current) {
        await pdfDocRef.current.destroy();
        pdfDocRef.current = null;
      }
    } catch (err) {
      console.error('Cleanup error:', err);
    }
  };

  const renderPreview = async () => {
    if (!canvasRef.current) return;

    await cleanupResources();
    renderTaskRef.current = new AbortController();

    try {
      setIsLoading(true);
      setError(null);

      // Clone ArrayBuffer to prevent detachment
      const arrayBuffer = pageData.docBytes.slice(0);
      const uint8Array = new Uint8Array(arrayBuffer);

      // Load the PDF document with proper configuration
      const loadingTask = pdfjsLib.getDocument({
        data: uint8Array,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
        cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/cmaps/`,
        cMapPacked: true,
        // Add standardFontDataUrl for better font support
        standardFontDataUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/standard_fonts/`,
        // Disable range requests which can cause issues with some PDFs
        disableRange: true,
        // Increase maximum image size to handle large pages
        maxImageSize: 16777216,
      });

      // Store loading task for cleanup
      pdfDocRef.current = await loadingTask.promise;

      if (renderTaskRef.current?.signal.aborted) {
        throw new Error('Rendering aborted');
      }

      // Get the page
      pageRef.current = await pdfDocRef.current.getPage(pageData.pageIndex + 1);
      const page = pageRef.current;

      if (!page || renderTaskRef.current?.signal.aborted) {
        throw new Error('Page loading aborted');
      }

      // Calculate optimal scale
      const viewport = page.getViewport({ scale: 1.0 });
      const desiredWidth = 250;
      const pixelRatio = window.devicePixelRatio || 1;
      
      // Ensure a minimum scale to prevent rendering issues
      const scale = Math.max(0.5, (desiredWidth * pixelRatio) / viewport.width);
      const scaledViewport = page.getViewport({ scale });

      // Set up canvas
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d', { 
        alpha: false,
        willReadFrequently: true
      });
      
      if (!context) throw new Error('Could not get canvas context');

      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;
      canvas.style.width = `${scaledViewport.width / pixelRatio}px`;
      canvas.style.height = `${scaledViewport.height / pixelRatio}px`;

      // Clear previous content
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);

      if (renderTaskRef.current?.signal.aborted) {
        throw new Error('Canvas setup aborted');
      }

      // First try: Simple render with no WebGL
      try {
        await page.render({
          canvasContext: context,
          viewport: scaledViewport,
          intent: 'display',
        }).promise;
      } catch (error) {
        console.warn('First render attempt failed:', error);
        
        // Second try: With additional parameters
        if (!renderTaskRef.current?.signal.aborted) {
          try {
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            await page.render({
              canvasContext: context,
              viewport: scaledViewport,
              intent: 'display',
            }).promise;
          } catch (secondError) {
            console.warn('Second render attempt failed:', secondError);
            
            // Third try: Reduced scale
            if (!renderTaskRef.current?.signal.aborted) {
              try {
                // Use a very low scale for problematic PDFs
                const lowScaleViewport = page.getViewport({ scale: 0.2 });
                
                canvas.width = lowScaleViewport.width;
                canvas.height = lowScaleViewport.height;
                canvas.style.width = `${lowScaleViewport.width / pixelRatio}px`;
                canvas.style.height = `${lowScaleViewport.height / pixelRatio}px`;
                
                context.fillStyle = '#ffffff';
                context.fillRect(0, 0, canvas.width, canvas.height);
                
                await page.render({
                  canvasContext: context,
                  viewport: lowScaleViewport,
                  intent: 'display',
                  annotationMode: 0, // DISABLE
                }).promise;
              } catch (thirdError) {
                // If all rendering attempts fail, show error
                throw thirdError;
              }
            }
          }
        }
      }
    } catch (err: Error | any) {
      if (err?.name !== 'AbortError' && !renderTaskRef.current?.signal.aborted) {
        console.error('Preview rendering error:', err);
        setError(err instanceof Error ? err.message : 'Failed to render preview');
        
        // Even if we fail to render the preview, don't prevent the user from
        // clicking to open the editor where it might render correctly
        setIsLoading(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEdits = async (pageData: PageData, canvas: fabric.Canvas) => {
    try {
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      
      // Load the source PDF
      const sourcePdfDoc = await PDFDocument.load(pageData.docBytes.slice(0));
      
      // Copy all pages except the one being edited
      const pages = sourcePdfDoc.getPages();
      const targetPageIndex = pageData.pageIndex;
      
      // Copy the non-modified pages
      for (let i = 0; i < pages.length; i++) {
        if (i === targetPageIndex) continue;
        const [copiedPage] = await pdfDoc.copyPages(sourcePdfDoc, [i]);
        pdfDoc.addPage(copiedPage);
      }
      
      // Create a new page with the same dimensions as the original
      const originalPage = pages[targetPageIndex];
      const { width, height } = originalPage.getSize();
      const newPage = pdfDoc.addPage([width, height]);
      
      // Convert canvas to an image
      const dataUrl = canvas.toDataURL({
        multiplier: 1,
        format: 'jpeg',
        quality: 0.95,
      });
      
      // Extract base64 data
      const base64Data = dataUrl.split(',')[1];
      const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      // Embed the image in the PDF
      const image = await pdfDoc.embedJpg(imageBytes);
      
      // Draw the image on the page
      newPage.drawImage(image, {
        x: 0,
        y: 0,
        width: width,
        height: height
      });
      
      // Save the new PDF
      const modifiedPdfBytes = await pdfDoc.save();
      
      // Update the original pageData with the new PDF bytes
      pageData.docBytes = modifiedPdfBytes.buffer as ArrayBuffer;
      
      // Re-render the thumbnail
      renderPreview();
      
    } catch (err) {
      console.error('Error saving edits:', err);
      alert('Failed to save edits. Please try again.');
    }
  };

  const handleOpenEditor = () => {
    setShowEditor(true);
  };

  useEffect(() => {
    renderPreview();
    return () => {
      cleanupResources();
    };
  }, [pageData]);

  // Add click handler to open editor
  const handleClick = (e: React.MouseEvent) => {
    // Only open editor if not dragging and not clicking on close button
    if (!isDragging && e.target && !(e.target as Element).closest('button')) {
      handleOpenEditor();
    }
  };

  drag(drop(ref));

  const pageName = `${pageData.fileName} - Page ${pageData.originalIndex + 1}`

  return (
    <>
      <Card
        ref={ref}
        style={{ opacity: isDragging ? 0.4 : 1, cursor: 'move', width: '10rem' }}
        className="m-2 shadow-sm position-relative"
        border={isDragging ? 'primary' : 'light'}
        onClick={handleClick}
        role="button"
        tabIndex={0}
      >
        <CloseButton
          onClick={(e) => {
            e.stopPropagation();
            pageData.removePage(index);
          }}
          style={{ position: 'absolute', top: '5px', right: '5px', zIndex: 99 }}
          aria-label="Remove page"
          className="bg-danger p-1"
        />
        <Card.Body className="p-1 text-center">
          {isLoading && (
            <div className="position-absolute top-50 start-50 translate-middle">
              <Spinner animation="border" size="sm" />
            </div>
          )}
          {error && (
            <div className="text-danger small position-absolute top-50 start-50 translate-middle w-100 px-2">
              {error}
            </div>
          )}
          <canvas 
            ref={canvasRef} 
            style={{ 
              maxWidth: '100%',
              height: 'auto',
              visibility: isLoading ? 'hidden' : 'visible',
              display: error ? 'none' : 'block'
            }} 
          />
          <Card.Text className="text-muted small mt-1 text-truncate" title={pageName}>
            {pageName}
          </Card.Text>
        </Card.Body>
      </Card>
      
      {/* PDF Page Editor Modal */}
      <PdfPageEditor
        show={showEditor}
        onHide={() => setShowEditor(false)}
        pageData={showEditor ? pageData : null}
        onSave={handleSaveEdits}
      />
    </>
  );
};