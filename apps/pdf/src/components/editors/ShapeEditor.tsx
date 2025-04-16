import React, { useState } from 'react';
import { Form, Button, Card, ButtonGroup } from 'react-bootstrap';
import * as fabric from 'fabric';

interface ShapeEditorProps {
  canvas: fabric.Canvas;
  onHistoryUpdate?: () => void;
}

export const ShapeEditor: React.FC<ShapeEditorProps> = ({ canvas, onHistoryUpdate }) => {
  const [fillColor, setFillColor] = useState('#ffffff');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [opacity, setOpacity] = useState(1);
  
  const addRectangle = () => {
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 100,
      height: 80,
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth: strokeWidth,
      opacity: opacity,
    });
    
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
    
    if (onHistoryUpdate) onHistoryUpdate();
  };
  
  const addCircle = () => {
    const circle = new fabric.Circle({
      left: 100,
      top: 100,
      radius: 50,
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth: strokeWidth,
      opacity: opacity,
    });
    
    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.renderAll();
    
    if (onHistoryUpdate) onHistoryUpdate();
  };
  
  const addTriangle = () => {
    const triangle = new fabric.Triangle({
      left: 100,
      top: 100,
      width: 100,
      height: 100,
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth: strokeWidth,
      opacity: opacity,
    });
    
    canvas.add(triangle);
    canvas.setActiveObject(triangle);
    canvas.renderAll();
    
    if (onHistoryUpdate) onHistoryUpdate();
  };
  
  const addLine = () => {
    const line = new fabric.Line([50, 50, 200, 50], {
      stroke: strokeColor,
      strokeWidth: strokeWidth,
      opacity: opacity,
    });
    
    canvas.add(line);
    canvas.setActiveObject(line);
    canvas.renderAll();
    
    if (onHistoryUpdate) onHistoryUpdate();
  };
  
  const addArrow = () => {
    const line = new fabric.Line([50, 50, 200, 50], {
      stroke: strokeColor,
      strokeWidth: strokeWidth,
      opacity: opacity,
    });
    
    const triangle = new fabric.Triangle({
      width: 20,
      height: 20,
      left: 200,
      top: 50,
      angle: 90,
      fill: strokeColor,
      opacity: opacity,
    });
    
    const arrow = new fabric.Group([line, triangle], {
      left: 100,
      top: 100,
      selectable: true,
    });
    
    canvas.add(arrow);
    canvas.setActiveObject(arrow);
    canvas.renderAll();
    
    if (onHistoryUpdate) onHistoryUpdate();
  };

  return (
    <div>
      <Card className="mb-3">
        <Card.Body>
          <div className="mb-3">
            <Form.Label>Select Shape</Form.Label>
            <div className="d-grid gap-2">
              <ButtonGroup>
                <Button onClick={addRectangle}>Rectangle</Button>
                <Button onClick={addCircle}>Circle</Button>
                <Button onClick={addTriangle}>Triangle</Button>
              </ButtonGroup>
              <ButtonGroup>
                <Button onClick={addLine}>Line</Button>
                <Button onClick={addArrow}>Arrow</Button>
              </ButtonGroup>
            </div>
          </div>
          
          <Form.Group className="mb-3">
            <Form.Label>Fill Color</Form.Label>
            <Form.Control
              type="color"
              value={fillColor}
              onChange={(e) => setFillColor(e.target.value)}
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Stroke Color</Form.Label>
            <Form.Control
              type="color"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Stroke Width: {strokeWidth}px</Form.Label>
            <Form.Range 
              min={0.5} 
              max={10} 
              step={0.5}
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(parseFloat(e.target.value))}
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Opacity: {Math.round(opacity * 100)}%</Form.Label>
            <Form.Range 
              min={0.1} 
              max={1} 
              step={0.1}
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
            />
          </Form.Group>
        </Card.Body>
      </Card>
    </div>
  );
};