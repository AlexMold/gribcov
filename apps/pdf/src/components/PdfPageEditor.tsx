'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Modal, Row, Col, Nav, Tab, Button, Spinner } from 'react-bootstrap';
import * as fabric from 'fabric';
import * as pdfjsLib from 'pdfjs-dist';
import { TextEditor } from './editors/TextEditor';
import { TableEditor } from './editors/TableEditor';
import { ShapeEditor } from './editors/ShapeEditor';
import { DrawEditor } from './editors/DrawEditor';
import { PageData } from '../types';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;

interface PdfPageEditorProps {
  show: boolean;
  onHide: () => void;
  pageData: PageData | null;
  onSave: (pageData: PageData, canvasData: fabric.Canvas) => Promise<void>;
}

export const PdfPageEditor: React.FC<PdfPageEditorProps> = ({ 
  show, 
  onHide, 
  pageData, 
  onSave 
}) => {
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<string>('text');
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (show && pageData && canvasRef.current) {
      setLoading(true);
      initCanvas();
    }
    
    return () => {
      // Clean up canvas when component unmounts
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [show, pageData]);

  const initCanvas = async () => {
    if (!pageData || !canvasRef.current || !containerRef.current) return;

    try {
      // Clean up existing canvas if any
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
      }

      // Create new Fabric canvas
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        preserveObjectStacking: true,
      });
      fabricCanvasRef.current = fabricCanvas;
      setCanvas(fabricCanvas);
      
      // Get container dimensions for responsive sizing
      const containerWidth = containerRef.current.clientWidth;
      
      // Load PDF page
      const arrayBuffer = pageData.docBytes.slice(0);
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(pageData.pageIndex + 1);
      
      // Calculate scale to fit container width
      const viewport = page.getViewport({ scale: 1.0 });
      const scale = containerWidth / viewport.width;
      const scaledViewport = page.getViewport({ scale });
      
      // Set canvas size
      fabricCanvas.setWidth(scaledViewport.width);
      fabricCanvas.setHeight(scaledViewport.height);
      
      // Create a hidden canvas for PDF rendering
      const hiddenCanvas = document.createElement('canvas');
      hiddenCanvas.width = scaledViewport.width;
      hiddenCanvas.height = scaledViewport.height;
      const hiddenContext = hiddenCanvas.getContext('2d');
      
      if (hiddenContext) {
        // Render PDF to hidden canvas
        const renderContext = {
          canvasContext: hiddenContext,
          viewport: scaledViewport,
        };
        
        await page.render(renderContext).promise;
        
        // Convert to Fabric image and add as background
        fabric.FabricImage.fromURL(hiddenCanvas.toDataURL()).then((img) => {
            fabricCanvas.backgroundImage = img;
            fabricCanvas.requestRenderAll();
            setLoading(false);
          });
      } else {
        throw new Error('Could not get canvas context');
      }
    } catch (err) {
      console.error('Error initializing PDF editor:', err);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!canvas || !pageData) return;
    
    setSaving(true);
    try {
      await onSave(pageData, canvas);
      onHide();
    } catch (err) {
      console.error('Error saving changes:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} fullscreen className="pdf-editor-modal">
      <Modal.Header closeButton>
        <Modal.Title>
          {pageData ? `Edit Page ${pageData.originalIndex + 1} of ${pageData.fileName}` : 'PDF Editor'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        <Row className="h-100 g-0">
          {/* Left sidebar with tools */}
          <Col xs={12} md={3} lg={2} className="border-end">
            <Tab.Container activeKey={currentTab} onSelect={(k) => k && setCurrentTab(k)}>
              <Nav variant="pills" className="flex-column p-2">
                <Nav.Item>
                  <Nav.Link eventKey="text">
                    <i className="bi bi-type me-2"></i>Text
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="table">
                    <i className="bi bi-grid-3x3 me-2"></i>Tables
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="shapes">
                    <i className="bi bi-square me-2"></i>Shapes
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="draw">
                    <i className="bi bi-pencil me-2"></i>Draw
                  </Nav.Link>
                </Nav.Item>
              </Nav>
              <Tab.Content className="p-3">
                <Tab.Pane eventKey="text">
                  {canvas && <TextEditor canvas={canvas} />}
                </Tab.Pane>
                <Tab.Pane eventKey="table">
                  {canvas && <TableEditor canvas={canvas} />}
                </Tab.Pane>
                <Tab.Pane eventKey="shapes">
                  {canvas && <ShapeEditor canvas={canvas} />}
                </Tab.Pane>
                <Tab.Pane eventKey="draw">
                  {canvas && <DrawEditor canvas={canvas} />}
                </Tab.Pane>
              </Tab.Content>
            </Tab.Container>
          </Col>
          
          {/* Main editor area */}
          <Col xs={12} md={9} lg={10} className="pdf-canvas-container">
            <div 
              ref={containerRef}
              className="d-flex justify-content-center align-items-start p-4 h-100 overflow-auto"
            >
                <canvas ref={canvasRef} />

            </div>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSave} 
          disabled={saving || loading}
        >
          {saving ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Saving...
            </>
          ) : 'Save Changes'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};