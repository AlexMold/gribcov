'use client';
import React, { useRef, useEffect, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Card, CloseButton, Spinner } from 'react-bootstrap';
import { ItemTypes } from '../constants';
import type { PageData } from '../types';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import type { DragSourceMonitor, DropTargetMonitor } from 'react-dnd';

// Initialize PDF.js worker
const PDFJS_VERSION = pdfjsLib.version;
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.mjs`;

interface PageThumbnailProps {
  id: string;
  index: number;
  pageData: PageData;
  movePage: (dragIndex: number, hoverIndex: number) => void;
}

export const PageThumbnail: React.FC<PageThumbnailProps> = ({ id, index, pageData, movePage }) => {
  const ref = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const [, drop] = useDrop({
    accept: ItemTypes.PAGE,
    hover(item: { id: string; index: number }, monitor: DropTargetMonitor) {
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
        useWorkerFetch: false, // Prevent worker from fetching
        isEvalSupported: false, // Disable eval
        useSystemFonts: true,
        cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/cmaps/`,
        cMapPacked: true,
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
      const desiredWidth = 150;
      const pixelRatio = window.devicePixelRatio || 1;
      const scale = (desiredWidth * pixelRatio) / viewport.width;
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

      // Render with WebGL if possible
      try {
        await page.render({
          canvasContext: context,
          viewport: scaledViewport,
          enableWebGL: true,
          signal: renderTaskRef.current?.signal
        }).promise;
      } catch (webglError) {
        console.warn('WebGL rendering failed, falling back to canvas:', webglError);
        if (!renderTaskRef.current?.signal.aborted) {
          await page.render({
            canvasContext: context,
            viewport: scaledViewport,
            enableWebGL: false,
            signal: renderTaskRef.current?.signal
          }).promise;
        }
      }

    } catch (err) {
      if (err?.name !== 'AbortError' && !renderTaskRef.current?.signal.aborted) {
        console.error('Preview rendering error:', err);
        setError(err instanceof Error ? err.message : 'Failed to render preview');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    renderPreview();
    return () => {
      cleanupResources();
    };
  }, [pageData]);

  drag(drop(ref));

  return (
    <Card
      ref={ref}
      style={{ opacity: isDragging ? 0.4 : 1, cursor: 'move', width: '10rem' }}
      className="m-2 shadow-sm position-relative"
      border={isDragging ? 'primary' : 'light'}
    >
      <CloseButton
        onClick={() => pageData.removePage(index)}
        style={{ position: 'absolute', top: '5px', right: '5px', zIndex: 1 }}
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
        <Card.Text className="text-muted small mt-1 text-truncate">
          {pageData.fileName} - Page {pageData.originalIndex + 1}
        </Card.Text>
      </Card.Body>
    </Card>
  );
};