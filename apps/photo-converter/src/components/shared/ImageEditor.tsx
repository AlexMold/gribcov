"use client";
import React, { useState, useEffect, useRef } from "react";
import { Button, ButtonGroup, Form } from "react-bootstrap";
import { useLanguage } from "../../contexts/LanguageContext";
import { Canvas, filters as FabricFilters, FabricImage, Rect } from "fabric";
import "./imageEditor.scss";

interface ImageEditorProps {
  imageUrl: string;
  onSave: (editedImageUrl: string) => void;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ imageUrl, onSave }) => {
  const { t } = useLanguage();
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [image, setImage] = useState<FabricImage | null>(null);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [filter, setFilter] = useState("none");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCropMode, setIsCropMode] = useState(false);
  const [cropRect, setCropRect] = useState<Rect | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filters = {
    none: [],
    grayscale: [new FabricFilters.Grayscale()],
    sepia: [new FabricFilters.Sepia()],
    invert: [new FabricFilters.Invert()],
    blur: [new FabricFilters.Blur({ blur: 0.2 })],
    brightness: [new FabricFilters.Brightness({ brightness: 0.5 })],
    contrast: [new FabricFilters.Contrast({ contrast: 0.5 })],
    saturation: [new FabricFilters.Saturation({ saturation: 0.5 })],
    noise: [new FabricFilters.Noise({ noise: 100 })],
    pixelate: [new FabricFilters.Pixelate({ blocksize: 4 })],
    blendColor: [new FabricFilters.BlendColor({ color: "#00ff00", mode: "multiply", alpha: 0.5 })],
    vintage: [
      new FabricFilters.Grayscale(),
      new FabricFilters.Sepia(),
      new FabricFilters.Noise({ noise: 20 }),
      new FabricFilters.Brightness({ brightness: -0.1 }),
    ],
    blackAndWhite: [new FabricFilters.BlackWhite(), new FabricFilters.Contrast({ contrast: 0.2 })],
    sharpen: [
      new FabricFilters.Convolute({
        matrix: [0, -1, 0, -1, 5, -1, 0, -1, 0],
      }),
    ],
    emboss: [
      new FabricFilters.Convolute({
        matrix: [1, 1, 1, 1, 0.7, -1, -1, -1, -1],
      }),
    ],
  };

  const getRotatedDimensions = (width: number, height: number, angle: number) => {
    const radians = (Math.abs(angle) * Math.PI) / 180;
    const sin = Math.abs(Math.sin(radians));
    const cos = Math.abs(Math.cos(radians));

    const rotatedWidth = width * cos + height * sin;
    const rotatedHeight = width * sin + height * cos;

    return { width: rotatedWidth, height: rotatedHeight };
  };

  const calculateScaleToFit = (
    imageWidth: number,
    imageHeight: number,
    containerWidth: number,
    containerHeight: number,
    padding: number = 40
  ) => {
    const maxWidth = containerWidth - padding;
    const maxHeight = containerHeight - padding;

    const scaleX = maxWidth / imageWidth;
    const scaleY = maxHeight / imageHeight;

    return Math.min(scaleX, scaleY);
  };

  const fitImageToContainer = (img: FabricImage, containerWidth: number, containerHeight: number) => {
    if (!img.width || !img.height) return 1;

    // Use original dimensions for calculations
    const originalWidth = img.width;
    const originalHeight = img.height;

    // Get rotated dimensions of original size
    const rotated = getRotatedDimensions(originalWidth, originalHeight, rotation);

    // Calculate scale based on rotated bounds
    const scale = calculateScaleToFit(rotated.width, rotated.height, containerWidth, containerHeight);

    // Apply transformations
    img.set({
      scaleX: scale,
      scaleY: scale,
      left: containerWidth / 2,
      top: containerHeight / 2,
      originX: "center",
      originY: "center",
    });

    setZoom(scale);
    return scale;
  };

  useEffect(() => {
    if (canvasRef.current && containerRef.current) {
      const fabricCanvas = new Canvas(canvasRef.current, {
        backgroundColor: "#f8f9fa",
        preserveObjectStacking: true,
        selection: false,
      });

      const containerWidth = containerRef.current.offsetWidth;
      const containerHeight = containerRef.current.offsetHeight;

      fabricCanvas.setDimensions({
        width: containerWidth,
        height: containerHeight,
      });

      setCanvas(fabricCanvas);

      // Add resize observer
      const resizeObserver = new ResizeObserver((entries) => {
        const { width, height } = entries[0].contentRect;
        fabricCanvas.setDimensions({ width, height });

        if (image) {
          fitImageToContainer(image, width, height);
          fabricCanvas.centerObject(image);
          fabricCanvas.renderAll();
        }
      });

      resizeObserver.observe(containerRef.current);

      return () => {
        resizeObserver.disconnect();
        fabricCanvas.dispose();
      };
    }
  }, []);

  useEffect(() => {
    if (canvas && imageUrl && containerRef.current) {
      canvas.clear();

      FabricImage.fromURL(imageUrl, { crossOrigin: "anonymous" }).then((fImg) => {
        if (!fImg) return;

        const containerWidth = containerRef.current?.offsetWidth || 0;
        const containerHeight = containerRef.current?.offsetHeight || 0;

        fImg.set({
          selectable: false,
          evented: false,
        });

        fitImageToContainer(fImg, containerWidth, containerHeight);

        canvas.add(fImg);
        canvas.centerObject(fImg);
        fImg.setCoords();
        canvas.renderAll();

        setImage(fImg);
      });
    }
  }, [canvas, imageUrl]);

  const handleRotate = (angle: number) => {
    if (!image || !canvas || !containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = containerRef.current.offsetHeight;

    setRotation((prev) => {
      const newRotation = prev + angle;

      // Get original dimensions without zoom
      const originalWidth = image.width!;
      const originalHeight = image.height!;

      // Calculate rotated bounds of original image
      const rotated = getRotatedDimensions(originalWidth, originalHeight, newRotation);

      // Calculate scale to fit rotated bounds
      const newScale = calculateScaleToFit(rotated.width, rotated.height, containerWidth, containerHeight);

      // Apply transformations in order
      image.set({
        angle: newRotation,
        scaleX: newScale,
        scaleY: newScale,
        left: containerWidth / 2,
        top: containerHeight / 2,
        originX: "center",
        originY: "center",
      });

      // Update state and render
      setZoom(newScale);
      canvas.requestRenderAll();

      return newRotation;
    });
  };

  const handleZoom = (value: number) => {
    if (image) {
      setZoom(value);
      image.scale(value);
      canvas?.renderAll();
    }
  };

  const handleFilter = (filterName: string) => {
    if (image) {
      setFilter(filterName);
      image.filters = filters[filterName as keyof typeof filters];
      image.applyFilters();
      canvas?.renderAll();
    }
  };

  const applyChanges = async () => {
    try {
      setIsProcessing(true);
      if (!canvas || !image) return;

      // Get original image dimensions
      const width = image.width || 0;
      const height = image.height || 0;

      // Calculate rotated dimensions
      const angle = (rotation * Math.PI) / 180;
      const sin = Math.abs(Math.sin(angle));
      const cos = Math.abs(Math.cos(angle));
      const newWidth = Math.floor(width * cos + height * sin);
      const newHeight = Math.floor(height * cos + width * sin);

      // Create temporary canvas for export
      const tempCanvas = document.createElement("canvas");
      const ctx = tempCanvas.getContext("2d");
      if (!ctx) return;

      // Set dimensions to fit rotated image
      tempCanvas.width = newWidth;
      tempCanvas.height = newHeight;

      // Create a new fabric canvas for export
      const exportCanvas = new Canvas(tempCanvas);

      // Create and initialize new image instance for export
      const imgElement = image.getElement();
      const exportImage = new FabricImage(imgElement)

      // Apply current filters
      exportImage.filters = [...(filters[filter as keyof typeof filters])];
      await exportImage.applyFilters();

      // Set image properties
      exportImage.set({
        left: newWidth / 2,
        top: newHeight / 2,
        originX: 'center',
        originY: 'center',
        angle: rotation,
        scaleX: 1,
        scaleY: 1
      });

      // Add to canvas and render
      exportCanvas.add(exportImage);
      exportCanvas.renderAll();

      // Get the final image data
      const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.9);

      // Cleanup
      exportCanvas.dispose();
      tempCanvas.remove();

      onSave(dataUrl);
    } catch (error) {
      console.error("Error processing image:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const initCropMode = () => {
    if (!canvas || !image) return;

    setIsCropMode(true);

    // Create crop rectangle
    const rect = new Rect({
      left: image.left! - (image.width! * image.scaleX!) / 4,
      top: image.top! - (image.height! * image.scaleY!) / 4,
      width: (image.width! * image.scaleX!) / 2,
      height: (image.height! * image.scaleY!) / 2,
      fill: "transparent",
      stroke: "#fff",
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      transparentCorners: false,
      cornerColor: "#fff",
      cornerStrokeColor: "#000",
      cornerSize: 10,
      lockRotation: true,
      hasRotatingPoint: false,
    });

    canvas.add(rect);
    setCropRect(rect);
    canvas.setActiveObject(rect);

    // Disable image manipulation during crop
    image.selectable = false;
    canvas.renderAll();
  };

  const applyCrop = () => {
    if (!canvas || !image || !cropRect) return;

    // Calculate crop coordinates relative to image
    const imageEl = image.getElement();
    const scale = image.scaleX!;

    const left = (cropRect.left! - image.left!) / scale + image.width! / 2;
    const top = (cropRect.top! - image.top!) / scale + image.height! / 2;
    const width = (cropRect.width! * cropRect.scaleX!) / scale;
    const height = (cropRect.height! * cropRect.scaleY!) / scale;

    // Create new cropped canvas
    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = width;
    cropCanvas.height = height;

    const ctx = cropCanvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(imageEl, left, top, width, height, 0, 0, width, height);

    // Update image with cropped version
    FabricImage.fromURL(cropCanvas.toDataURL()).then((croppedImg) => {
      canvas.remove(cropRect);
      canvas.remove(image);

      croppedImg.set({
        left: canvas.width! / 2,
        top: canvas.height! / 2,
        originX: "center",
        originY: "center",
        selectable: false,
      });

      canvas.add(croppedImg);
      setImage(croppedImg);
      setCropRect(null);
      setIsCropMode(false);
      canvas.renderAll();
    });
  };

  const cancelCrop = () => {
    if (!canvas || !cropRect) return;

    canvas.remove(cropRect);
    setCropRect(null);
    setIsCropMode(false);
    canvas.renderAll();
  };

  return (
    <div className="image-editor d-flex">
      <div className="editor-sidebar bg-light p-3 border-end flex-grow-0" style={{ width: "250px" }}>
        <div className="mb-4">
          <h6>{t("editor.crop")}</h6>
          {!isCropMode ? (
            <Button 
              variant="outline-secondary" 
              className="w-100"
              onClick={initCropMode}
              disabled={isProcessing}
            >
              <i className="bi bi-crop me-2"></i>
              {t("editor.cropMode")}
            </Button>
          ) : (
            <>
              <Button 
                variant="success" 
                className="mb-2 w-100"
                onClick={applyCrop}
              >
                <i className="bi bi-check-lg me-2"></i>
                {t("editor.applyCrop")}
              </Button>
              <Button 
                className="w-100"
                variant="danger" 
                onClick={cancelCrop}
              >
                <i className="bi bi-x-lg me-2"></i>
                {t("editor.cancelCrop")}
              </Button>
              </>
          )}
        </div>

        <div className="mb-4">
          <h6>{t("editor.rotation")}</h6>
          <ButtonGroup className="w-100">
            <Button variant="outline-secondary" onClick={() => handleRotate(-90)} aria-label={t("editor.rotateLeft")}>
              <i className="bi bi-arrow-counterclockwise"></i>
            </Button>
            <Button variant="outline-secondary" onClick={() => handleRotate(90)} aria-label={t("editor.rotateRight")}>
              <i className="bi bi-arrow-clockwise"></i>
            </Button>
          </ButtonGroup>
        </div>

        <div className="mb-4">
          <h6>{t("editor.zoom")}</h6>
          <Form.Range
            value={zoom * 100}
            onChange={(e) => handleZoom((Number(e.target.value) / 100))}
            min="50"
            max="500"
            step="10"
          />
        </div>

        <div className="mb-4">
          <h6>{t("editor.filters")}</h6>
          <Form.Select value={filter} onChange={(e) => handleFilter(e.target.value)} size="sm">
            <option value="none">{t("editor.noFilter")}</option>
            <option value="grayscale">{t("editor.grayscale")}</option>
            <option value="sepia">{t("editor.sepia")}</option>
            <option value="invert">{t("editor.invert")}</option>
            <option value="blur">{t("editor.blur")}</option>
            <option value="brightness">{t("editor.brightness")}</option>
            <option value="contrast">{t("editor.contrast")}</option>
            <option value="saturation">{t("editor.saturation")}</option>
            <option value="noise">{t("editor.noise")}</option>
            <option value="pixelate">{t("editor.pixelate")}</option>
            <option value="blendColor">{t("editor.blendColor")}</option>
            <option value="vintage">{t("editor.vintage")}</option>
            <option value="blackAndWhite">{t("editor.blackAndWhite")}</option>
            <option value="sharpen">{t("editor.sharpen")}</option>
            <option value="emboss">{t("editor.emboss")}</option>
          </Form.Select>
        </div>

        <Button variant="primary" className="w-100" onClick={applyChanges} disabled={isProcessing}>
          {isProcessing ? t("editor.processing") : t("editor.apply")}
        </Button>
      </div>

      <div
        ref={containerRef}
        className="editor-main d-flex align-items-center justify-content-center flex-grow-1"
        style={{ minHeight: "500px" }} // Ensure minimum height
      >
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};
