import React, { useState, useEffect } from 'react';
import { Form, Card, ButtonGroup, Button } from 'react-bootstrap';
import * as fabric from 'fabric';

interface DrawEditorProps {
  canvas: fabric.Canvas;
}

export const DrawEditor: React.FC<DrawEditorProps> = ({ canvas }) => {
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushWidth, setBrushWidth] = useState(3);
  const [brushType, setBrushType] = useState<'pencil' | 'spray' | 'pattern'>('pencil');
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  useEffect(() => {
    if (!canvas) return;

    const previousDrawingMode = canvas.isDrawingMode;
    canvas.isDrawingMode = isDrawingMode;

    if (isDrawingMode) {
      // Set brush properties
      if (brushType === 'pencil') {
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      } else if (brushType === 'spray') {
        canvas.freeDrawingBrush = new fabric.SprayBrush(canvas);
        (canvas.freeDrawingBrush as fabric.SprayBrush).density = 20;
        (canvas.freeDrawingBrush as fabric.SprayBrush).dotWidth = brushWidth;
        (canvas.freeDrawingBrush as fabric.SprayBrush).dotWidthVariance = 2;
      } else if (brushType === 'pattern') {
        canvas.freeDrawingBrush = new fabric.PatternBrush(canvas);
      }
      
      canvas.freeDrawingBrush.color = brushColor;
      canvas.freeDrawingBrush.width = brushWidth;
    }

    return () => {
      // Restore previous drawing mode when component unmounts
      canvas.isDrawingMode = previousDrawingMode;
    };
  }, [canvas, isDrawingMode, brushColor, brushWidth, brushType]);

  const toggleDrawingMode = () => {
    setIsDrawingMode(!isDrawingMode);
  };

  const clearDrawing = () => {
    if (canvas) {
      // Remove all path objects (drawings)
      const objects = canvas.getObjects();
      const pathObjects = objects.filter(obj => obj.type === 'path');
      pathObjects.forEach(path => canvas.remove(path));
      canvas.renderAll();
    }
  };

  return (
    <div>
      <Card className="mb-3">
        <Card.Body>
          <Button 
            variant={isDrawingMode ? "success" : "outline-secondary"} 
            onClick={toggleDrawingMode}
            className="w-100 mb-3"
          >
            {isDrawingMode ? "Drawing Mode On" : "Drawing Mode Off"}
          </Button>
          
          <Form.Group className="mb-3">
            <Form.Label>Brush Type</Form.Label>
            <div>
              <ButtonGroup className="w-100">
                <Button 
                  variant={brushType === 'pencil' ? "primary" : "outline-secondary"}
                  onClick={() => setBrushType('pencil')}
                >
                  Pencil
                </Button>
                <Button 
                  variant={brushType === 'spray' ? "primary" : "outline-secondary"}
                  onClick={() => setBrushType('spray')}
                >
                  Spray
                </Button>
                <Button 
                  variant={brushType === 'pattern' ? "primary" : "outline-secondary"}
                  onClick={() => setBrushType('pattern')}
                >
                  Pattern
                </Button>
              </ButtonGroup>
            </div>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Brush Color</Form.Label>
            <Form.Control
              type="color"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Brush Width: {brushWidth}px</Form.Label>
            <Form.Range 
              min={1} 
              max={30} 
              value={brushWidth}
              onChange={(e) => setBrushWidth(parseInt(e.target.value))}
            />
          </Form.Group>
          
          <Button 
            variant="danger" 
            onClick={clearDrawing} 
            className="w-100"
          >
            Clear Drawings
          </Button>
        </Card.Body>
      </Card>
    </div>
  );
};