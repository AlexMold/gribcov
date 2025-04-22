import React, { useState, useEffect } from 'react';
import { Form, Button, Card } from 'react-bootstrap';
import * as fabric from 'fabric';

interface TextEditorProps {
  canvas: fabric.Canvas;
  onHistoryUpdate?: () => void;
}

export const TextEditor: React.FC<TextEditorProps> = ({ canvas, onHistoryUpdate }) => {
  const [text, setText] = useState('Enter text here');
  const [fontSize, setFontSize] = useState(20);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [color, setColor] = useState('#000000');
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [selectedTextObject, setSelectedTextObject] = useState<fabric.Textbox | null>(null);

  const fontOptions = [
    'Arial', 'Helvetica', 'Times New Roman', 
    'Courier New', 'Verdana', 'Georgia'
  ];
  
  useEffect(() => {
    if (!canvas) return;
    
    const handleSelectionCreated = () => {
      const selectedObject = canvas.getActiveObject();
      if (selectedObject && selectedObject.type === 'textbox') {
        const textObject = selectedObject as fabric.Textbox;
        setSelectedTextObject(textObject);
        
        // Update form controls with selected text properties
        setText(textObject.text || '');
        setFontSize(textObject.fontSize as number || 20);
        setFontFamily(textObject.fontFamily || 'Arial');
        setColor(textObject.fill as string || '#000000');
        setBold(textObject.fontWeight === 'bold');
        setItalic(textObject.fontStyle === 'italic');
      }
    };
    
    const handleSelectionCleared = () => {
      setSelectedTextObject(null);
      // Reset form to defaults
      setText('Enter text here');
      setFontSize(20);
      setFontFamily('Arial');
      setColor('#000000');
      setBold(false);
      setItalic(false);
    };
    
    canvas.on('selection:created', handleSelectionCreated);
    canvas.on('selection:updated', handleSelectionCreated);
    canvas.on('selection:cleared', handleSelectionCleared);
    
    return () => {
      canvas.off('selection:created', handleSelectionCreated);
      canvas.off('selection:updated', handleSelectionCreated);
      canvas.off('selection:cleared', handleSelectionCleared);
    };
  }, [canvas]);
  
  // Update text object when form values change
  useEffect(() => {
    if (!selectedTextObject) return;
    
    selectedTextObject.set({
      text: text,
      fontSize: fontSize,
      fontFamily: fontFamily,
      fill: color,
      fontWeight: bold ? 'bold' : 'normal',
      fontStyle: italic ? 'italic' : 'normal'
    });
    
    canvas.renderAll();
    if (onHistoryUpdate) onHistoryUpdate();
  }, [text, fontSize, fontFamily, color, bold, italic, selectedTextObject]);

  const addText = () => {
    const textbox = new fabric.Textbox(text, {
      left: 50,
      top: 50,
      fontSize: fontSize,
      fontFamily: fontFamily,
      fill: color,
      fontWeight: bold ? 'bold' : 'normal',
      fontStyle: italic ? 'italic' : 'normal',
      width: 300,
    });
    
    canvas.add(textbox);
    canvas.setActiveObject(textbox);
    canvas.renderAll();
    
    // Update history after adding text
    if (onHistoryUpdate) {
      onHistoryUpdate();
    }
  };

  return (
    <div>
      <Card className="mb-3">
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>Text Content</Form.Label>
            <Form.Control 
              as="textarea" 
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Font</Form.Label>
            <Form.Select 
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
            >
              {fontOptions.map(font => (
                <option key={font} value={font}>{font}</option>
              ))}
            </Form.Select>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Size: {fontSize}px</Form.Label>
            <Form.Range 
              min={8} 
              max={72} 
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Color</Form.Label>
            <Form.Control
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </Form.Group>
          
          <div className="d-flex gap-2 mb-3">
            <Form.Check 
              type="switch"
              label="Bold"
              checked={bold}
              onChange={() => setBold(!bold)}
            />
            <Form.Check 
              type="switch"
              label="Italic"
              checked={italic}
              onChange={() => setItalic(!italic)}
            />
          </div>
          
          <Button variant="primary" onClick={addText} className="w-100 mb-2">
            Add New Text
          </Button>
        </Card.Body>
      </Card>
    </div>
  );
};