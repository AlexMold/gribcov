import React, { useState } from 'react';
import { Form, Button, Card, Row, Col } from 'react-bootstrap';
import * as fabric from 'fabric';

interface TableEditorProps {
  canvas: fabric.Canvas;
}

export const TableEditor: React.FC<TableEditorProps> = ({ canvas }) => {
  const [rows, setRows] = useState(3);
  const [columns, setColumns] = useState(3);
  const [cellWidth, setCellWidth] = useState(80);
  const [cellHeight, setCellHeight] = useState(40);
  const [borderColor, setBorderColor] = useState('#000000');
  const [borderWidth, setBorderWidth] = useState(1);

  const createTable = () => {
    const table = new fabric.Group([], {
      left: 50,
      top: 50,
      selectable: true,
    });

    // Create cells
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < columns; j++) {
        // Create rectangle for cell
        const cell = new fabric.Rect({
          left: j * cellWidth,
          top: i * cellHeight,
          width: cellWidth,
          height: cellHeight,
          fill: 'transparent',
          stroke: borderColor,
          strokeWidth: borderWidth,
          selectable: false,
        });

        // Create text box for cell
        const textbox = new fabric.Textbox('', {
          left: j * cellWidth + 5,
          top: i * cellHeight + 5,
          width: cellWidth - 10,
          height: cellHeight - 10,
          fontSize: 16,
          selectable: false,
          editable: true,
        });

        table.add(cell);
        table.add(textbox);
      }
    }

    canvas.add(table);
    canvas.setActiveObject(table);
    canvas.renderAll();
  };

  return (
    <div>
      <Card className="mb-3">
        <Card.Body>
          <Row className="mb-3">
            <Col>
              <Form.Group>
                <Form.Label>Rows</Form.Label>
                <Form.Control 
                  type="number" 
                  min="1" 
                  max="20" 
                  value={rows}
                  onChange={(e) => setRows(parseInt(e.target.value))}
                />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group>
                <Form.Label>Columns</Form.Label>
                <Form.Control 
                  type="number" 
                  min="1" 
                  max="20" 
                  value={columns}
                  onChange={(e) => setColumns(parseInt(e.target.value))}
                />
              </Form.Group>
            </Col>
          </Row>
          
          <Row className="mb-3">
            <Col>
              <Form.Group>
                <Form.Label>Cell Width</Form.Label>
                <Form.Control 
                  type="number" 
                  min="20" 
                  value={cellWidth}
                  onChange={(e) => setCellWidth(parseInt(e.target.value))}
                />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group>
                <Form.Label>Cell Height</Form.Label>
                <Form.Control 
                  type="number" 
                  min="20" 
                  value={cellHeight}
                  onChange={(e) => setCellHeight(parseInt(e.target.value))}
                />
              </Form.Group>
            </Col>
          </Row>
          
          <Row className="mb-3">
            <Col>
              <Form.Group>
                <Form.Label>Border Color</Form.Label>
                <Form.Control
                  type="color"
                  value={borderColor}
                  onChange={(e) => setBorderColor(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group>
                <Form.Label>Border Width</Form.Label>
                <Form.Control 
                  type="number" 
                  min="0.5" 
                  max="5" 
                  step="0.5"
                  value={borderWidth}
                  onChange={(e) => setBorderWidth(parseFloat(e.target.value))}
                />
              </Form.Group>
            </Col>
          </Row>
          
          <Button variant="primary" onClick={createTable} className="w-100">
            Add Table
          </Button>
        </Card.Body>
      </Card>
    </div>
  );
};