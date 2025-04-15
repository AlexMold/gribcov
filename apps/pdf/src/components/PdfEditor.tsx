'use client'
import React, { useState, useCallback, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Container, Row, Col, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { PageThumbnail } from './PageThumbnail';
import type { PageData } from '../types';
import "../styles/pdf-editor.scss";

export const PdfEditor: React.FC = () => {
  const [pages, setPages] = useState<PageData[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const renderPagePreview = useCallback(async (canvas: HTMLCanvasElement | null, pageData: PageData) => {
    if (!canvas || !pageData) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    try {
      const canvasWidth = 150;
      canvas.width = canvasWidth;
      const aspectRatio = 1.414;
      canvas.height = canvasWidth * aspectRatio;

      context.fillStyle = '#f8f9fa';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#6c757d';
      context.font = '12px sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(`Page ${pageData.originalIndex + 1}`, canvas.width / 2, canvas.height / 2);
      context.strokeStyle = '#dee2e6';
      context.strokeRect(0, 0, canvas.width, canvas.height);
    } catch (err) {
      console.error("Page rendering error:", err);
    }
  }, []);

  const handleFilesSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setError(null);
    setProcessing(true);
    const newPages: PageData[] = [];
    let pageIdCounter = pages.length;

    try {
      for (const file of files) {
        if (file.type !== 'application/pdf') continue;
        
        const fileBytes = await file.arrayBuffer();
        if (fileBytes.byteLength < 10) continue;

        try {
          const pdfDoc = await PDFDocument.load(fileBytes, {
            ignoreEncryption: true,
            updateMetadata: false
          });

          const pageCount = pdfDoc.getPageCount();
          for (let i = 0; i < pageCount; i++) {
            newPages.push({
              id: `page-${Date.now()}-${pageIdCounter++}`,
              docBytes: fileBytes,
              pageIndex: i,
              originalIndex: i,
              fileName: file.name,
              removePage: removePageByIndex,
            });
          }
        } catch (loadErr) {
          console.error(`Error loading PDF ${file.name}:`, loadErr);
          setError(`Failed to process ${file.name}`);
        }
      }
      setPages(prevPages => [...prevPages, ...newPages]);
    } catch (err) {
      console.error("File processing error:", err);
      setError(`File processing error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setProcessing(false);
      if (event.target) event.target.value = '';
    }
  };

  const movePage = useCallback((dragIndex: number, hoverIndex: number) => {
    setPages(prevPages => {
      const newPages = [...prevPages];
      const [draggedPage] = newPages.splice(dragIndex, 1);
      newPages.splice(hoverIndex, 0, draggedPage);
      return newPages;
    });
  }, []);

  const removePageByIndex = useCallback((indexToRemove: number) => {
    setPages(prevPages => prevPages.filter((_, index) => index !== indexToRemove));
  }, []);

  const handleMergeAndDownload = async () => {
    if (pages.length === 0) {
      setError("No pages to merge");
      return;
    }

    setError(null);
    setProcessing(true);

    try {
      const mergedPdf = await PDFDocument.create();
      const loadedDocsCache = new Map();

      for (const pageInfo of pages) {
        const cacheKey = `${pageInfo.fileName}_${pageInfo.docBytes.byteLength}`;
        
        let sourcePdfDoc = loadedDocsCache.get(cacheKey);
        if (!sourcePdfDoc) {
          sourcePdfDoc = await PDFDocument.load(pageInfo.docBytes, { 
            ignoreEncryption: true,
            updateMetadata: false 
          });
          loadedDocsCache.set(cacheKey, sourcePdfDoc);
        }

        const [copiedPage] = await mergedPdf.copyPages(sourcePdfDoc, [pageInfo.pageIndex]);
        mergedPdf.addPage(copiedPage);
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      saveAs(blob, 'merged_document.pdf');
    } catch (err) {
      console.error("PDF merge error:", err);
      setError(`PDF merge failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleClear = () => {
    setPages([]);
    setError(null);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Container className="py-4 pdf-editor">
        <h1 className="text-center mb-4">PDF Editor (Client-side)</h1>

        <Row className="justify-content-center mb-3 gy-2">
          <Col xs="auto">
            <Form.Control
              type="file"
              multiple
              accept=".pdf"
              ref={fileInputRef}
              onChange={handleFilesSelected}
              style={{ display: 'none' }}
            />
            <Button onClick={handleUploadClick} disabled={processing}>
              {processing ? (
                <Spinner animation="border" size="sm" />
              ) : 'Upload PDF'}
            </Button>
          </Col>
          <Col xs="auto">
            <Button
              variant="success"
              onClick={handleMergeAndDownload}
              disabled={processing || pages.length === 0}
            >
              {processing ? (
                <Spinner animation="border" size="sm" />
              ) : 'Merge & Download'}
            </Button>
          </Col>
          <Col xs="auto">
            <Button
              variant="danger"
              onClick={handleClear}
              disabled={processing || pages.length === 0}
            >
              Clear All
            </Button>
          </Col>
        </Row>

        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}

        {processing && pages.length === 0 && (
          <div className="text-center text-muted mt-5">
            <Spinner animation="border" role="status" />
            <p>Processing PDF files...</p>
          </div>
        )}

        <div className="mt-4 p-3 border rounded bg-light dropzone">
          {pages.length === 0 && !processing && (
            <p className="text-center text-muted">Upload PDF files to begin</p>
          )}
          <Row xs={1} sm={2} md={3} lg={4} xl={5} className="g-3 justify-content-center">
            {pages.map((page, index) => (
              <Col key={page.id} className="d-flex justify-content-center">
                <PageThumbnail
                  id={page.id}
                  index={index}
                  pageData={page}
                  movePage={movePage}
                  renderPage={renderPagePreview}
                />
              </Col>
            ))}
          </Row>
        </div>
        
        {pages.length > 0 && (
          <p className="text-center text-muted mt-2 small">
            Drag pages to reorder. Click × to remove.
          </p>
        )}
      </Container>
    </DndProvider>
  );
};