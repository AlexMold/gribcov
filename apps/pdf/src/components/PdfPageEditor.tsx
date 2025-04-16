'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Modal, Row, Col, Nav, Tab, Button, Spinner, ButtonGroup, OverlayTrigger, Tooltip } from 'react-bootstrap';
import * as fabric from 'fabric';
import * as pdfjsLib from 'pdfjs-dist';
import { TextEditor } from './editors/TextEditor';
import { TableEditor } from './editors/TableEditor';
import { ShapeEditor } from './editors/ShapeEditor';
import { DrawEditor } from './editors/DrawEditor';
import { PageData } from '../types';
import { CanvasHistory } from '../services/HistoryManager';

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
  const historyRef = useRef<CanvasHistory | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [hasSelectedObject, setHasSelectedObject] = useState(false);

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
      historyRef.current = null;
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
      
      // Initialize history for undo/redo
      historyRef.current = new CanvasHistory(fabricCanvas);
      updateHistoryButtons();
      
      // Set up canvas event listeners
      fabricCanvas.on('object:added', handleCanvasChange);
      fabricCanvas.on('object:removed', handleCanvasChange);
      fabricCanvas.on('object:modified', handleCanvasChange);
      
      // Selection change listener
      fabricCanvas.on('selection:created', () => setHasSelectedObject(true));
      fabricCanvas.on('selection:updated', () => setHasSelectedObject(true));
      fabricCanvas.on('selection:cleared', () => setHasSelectedObject(false));
      
      // Setup delete on keyboard 'Delete' key
      setupKeyboardListeners(fabricCanvas);
      
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

  const handleCanvasChange = () => {
    if (historyRef.current) {
      historyRef.current.saveState();
      updateHistoryButtons();
    }
  };

  const updateHistoryButtons = () => {
    if (historyRef.current) {
      setCanUndo(historyRef.current.canUndo());
      setCanRedo(historyRef.current.canRedo());
    }
  };

  const handleUndo = () => {
    if (historyRef.current && historyRef.current.undo()) {
      updateHistoryButtons();
    }
  };

  const handleRedo = () => {
    if (historyRef.current && historyRef.current.redo()) {
      updateHistoryButtons();
    }
  };

  const handleDeleteSelected = () => {
    if (canvas) {
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        canvas.remove(activeObject);
        canvas.discardActiveObject();
        canvas.renderAll();
        setHasSelectedObject(false);
        handleCanvasChange();
      }
    }
  };

  const setupKeyboardListeners = (canvas: fabric.Canvas) => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (document.activeElement?.tagName !== 'INPUT' && 
            document.activeElement?.tagName !== 'TEXTAREA') {
          const activeObject = canvas.getActiveObject();
          if (activeObject) {
            canvas.remove(activeObject);
            canvas.renderAll();
            handleCanvasChange();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
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
        
        {/* History and Object Controls */}
        <div className="ms-auto me-3">
          <ButtonGroup className="me-2">
            <OverlayTrigger overlay={<Tooltip>Undo (Ctrl+Z)</Tooltip>}>
              <Button 
                variant="outline-secondary" 
                size="sm" 
                onClick={handleUndo}
                disabled={!canUndo}
              >
                <i className="bi bi-arrow-counterclockwise"></i>
              </Button>
            </OverlayTrigger>
            
            <OverlayTrigger overlay={<Tooltip>Redo (Ctrl+Y)</Tooltip>}>
              <Button 
                variant="outline-secondary" 
                size="sm" 
                onClick={handleRedo}
                disabled={!canRedo}
              >
                <i className="bi bi-arrow-clockwise"></i>
              </Button>
            </OverlayTrigger>
          </ButtonGroup>
          
          <ButtonGroup>
            <OverlayTrigger overlay={<Tooltip>Delete Selected (Delete)</Tooltip>}>
              <Button 
                variant="outline-danger" 
                size="sm" 
                onClick={handleDeleteSelected}
                disabled={!hasSelectedObject}
              >
                <i className="bi bi-x-lg"></i>
              </Button>
            </OverlayTrigger>
          </ButtonGroup>
        </div>
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
                  {canvas && <TextEditor canvas={canvas} onHistoryUpdate={handleCanvasChange} />}
                </Tab.Pane>
                <Tab.Pane eventKey="table">
                  {canvas && <TableEditor canvas={canvas} onHistoryUpdate={handleCanvasChange} />}
                </Tab.Pane>
                <Tab.Pane eventKey="shapes">
                  {canvas && <ShapeEditor canvas={canvas} onHistoryUpdate={handleCanvasChange} />}
                </Tab.Pane>
                <Tab.Pane eventKey="draw">
                  {canvas && <DrawEditor canvas={canvas} onHistoryUpdate={handleCanvasChange} />}
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
              
                <div className="canvas-container position-relative">
                  <canvas ref={canvasRef} />
                  {/* Overlay delete button for selected objects */}
                  {hasSelectedObject && (
                    <div className="delete-button">
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={handleDeleteSelected}
                        title="Delete selected object"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  )}
                </div>
              
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