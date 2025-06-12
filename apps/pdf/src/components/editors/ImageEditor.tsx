import React, { useState, useRef, useEffect } from "react";
import { Button, Form, Card, Row, Col, Spinner } from "react-bootstrap";
import * as fabric from "fabric";
import { useLanguage } from "@gribcov/shared";

interface ImageEditorProps {
  canvas: fabric.Canvas;
  onHistoryUpdate: () => void;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ canvas, onHistoryUpdate }) => {
  const { t } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Clean up blob URL when component unmounts or when preview changes
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    // Clean up previous blob URL if it exists
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    // Create a preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Use HTML Image element to load the image first, then create a Fabric.js image
    const img = new Image();
    img.onload = () => {
      // Once the image is loaded successfully, create a Fabric.js image
      const fabricImage = new fabric.Image(img, {
        left: 0,
        top: 0,
      });

      // Scale image to a reasonable size if it's too large
      const maxWidth = canvas.width! / 2;
      const maxHeight = canvas.height! / 2;

      if (fabricImage.width! > maxWidth || fabricImage.height! > maxHeight) {
        const scaleFactor = Math.min(
          maxWidth / fabricImage.width!,
          maxHeight / fabricImage.height!
        );
        fabricImage.scale(scaleFactor);
      }

      // Center the image on canvas
      canvas.add(fabricImage);
      canvas.setActiveObject(fabricImage);
      canvas.centerObject(fabricImage);
      canvas.renderAll();

      // Update history
      onHistoryUpdate();
      setUploading(false);
    };

    img.onerror = () => {
      setError(t("editors.images.errorLoading"));
      setUploading(false);
      // Clean up the URL on error
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
      setPreviewUrl(null);
    };

    img.src = url;

    // Reset the input so the same file can be uploaded again
    event.target.value = "";
  };

  return (
    <div>
      <h5>{t("editors.images.title")}</h5>
      <p>{t("editors.images.description")}</p>

      <Form.Control
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <Button variant="primary" onClick={handleUploadClick} className="w-100 mb-3" disabled={uploading}>
        {uploading ? (
          <>
            <Spinner animation="border" size="sm" className="me-2" />
            {t("editors.images.uploading")}
          </>
        ) : (
          <>
            <i className="bi bi-upload me-2"></i>
            {t("editors.images.uploadButton")}
          </>
        )}
      </Button>

      {error && (
        <div className="alert alert-danger mt-2">{error}</div>
      )}

      {previewUrl && !error && (
        <Card className="mt-3">
          <Card.Header>{t("editors.images.lastUploadedImage")}</Card.Header>
          <Card.Body>
            <img
              src={previewUrl}
              alt={t("editors.images.previewAlt")}
              style={{ maxWidth: "100%", maxHeight: "150px" }}
            />
          </Card.Body>
        </Card>
      )}

      <div className="mt-3">
        <h6>{t("editors.images.tips")}</h6>
        <ul className="small">
          <li>{t("editors.images.tip1")}</li>
          <li>{t("editors.images.tip2")}</li>
          <li>{t("editors.images.tip3")}</li>
        </ul>
      </div>
    </div>
  );
};
