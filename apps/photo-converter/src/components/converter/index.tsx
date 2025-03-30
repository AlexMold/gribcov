"use client";
import React, { useState, useEffect } from "react";
import heic2any from "heic2any";
import UTIF from "utif";
import JSZip from "jszip";
import { saveAs } from "file-saver";
// @ts-ignore
import gifshot from "gifshot";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Alert,
  Card,
  Image as BootstrapImage,
  Modal,
  Collapse,
} from "react-bootstrap";
import { useDropzone } from "react-dropzone";
import "./converter.scss";

interface ImageFile {
  file: File;
  preview: string;
  converted?: {
    blob: Blob;
    url: string;
  };
  error?: string;
}

interface CompressionSettings {
  quality: number;
  maintainSize: boolean;
  maxWidth?: number;
  maxHeight?: number;
}

interface SelectedImageInfo {
  url: string;
  fileName?: string;
  format?: string;
}

const gifSettings = {
  interval: 0.5, // seconds between frames
  numFrames: 10,
  gifWidth: 800,
  gifHeight: 600,
};

const downloadImage = async (url: string, fileName: string) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    
    // Create an anchor element
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName; // Set suggested filename
    
    // Required for iOS Safari
    link.style.display = 'none';
    document.body.appendChild(link);
    
    // Trigger download
    if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android)/i)) {
      // Mobile handling
      window.location.href = url;
    } else {
      // Desktop handling
      link.click();
    }
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (err) {
    console.error('Download failed:', err);
  }
};

export const Converter: React.FC = () => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [outputFormat, setOutputFormat] = useState<string>("image/jpeg");
  const [globalError, setGlobalError] = useState<string>("");
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [gifPreview, setGifPreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<SelectedImageInfo | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [compressionSettings, setCompressionSettings] = useState<CompressionSettings>({
    quality: 0.7,
    maintainSize: true,
    maxWidth: 1920,
    maxHeight: 1080,
  });

  const handleOpenModal = (url: string, img?: ImageFile) => {
    setSelectedImage({
      url,
      fileName: img?.file.name,
      format: outputFormat.split("/")[1],
    });
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  const onDrop = async (acceptedFiles: File[]) => {
    setIsUploading(true);
    setUploadProgress(0);

    const total = acceptedFiles.length;
    let completed = 0;

    const newFiles = await Promise.all(
      acceptedFiles.map(async (file) => {
        const fileExtension = file.name.split(".").pop()?.toLowerCase();

        try {
          let result;
          if (fileExtension === "heic" || fileExtension === "heif") {
            const previewBlob = (await heic2any({
              blob: file,
              toType: "image/jpeg",
            })) as Blob;
            result = {
              file,
              preview: URL.createObjectURL(previewBlob),
            };
          } else {
            result = {
              file,
              preview: URL.createObjectURL(file),
            };
          }

          completed++;
          setUploadProgress(Math.round((completed / total) * 100));
          return result;
        } catch (err) {
          completed++;
          setUploadProgress(Math.round((completed / total) * 100));
          return {
            file,
            preview: URL.createObjectURL(file),
          };
        }
      })
    );

    setImages((prev) => [...prev, ...newFiles]);
    setIsUploading(false);
    setUploadProgress(0);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic", ".heif", ".tiff", ".tif"],
    },
    multiple: true,
  });

  const convertImages = async () => {
    setIsConverting(true);
    setGifPreview(null); // Reset GIF preview

    try {
      if (outputFormat === "image/gif" && images.length > 1) {
        // For GIF conversion of multiple images
        const blob = await createGif(images.map((img) => img.file));
        const gifUrl = URL.createObjectURL(blob);
        setGifPreview(gifUrl);

        // Update all images with the same converted GIF
        const updatedImages = images.map((img) => ({
          ...img,
          converted: {
            blob,
            url: gifUrl,
          },
        }));
        setImages(updatedImages);
      } else {
        // Regular conversion for other formats
        const updatedImages = await Promise.all(
          images.map(async (img, index) => {
            try {
              const fileExtension = img.file.name.split(".").pop()?.toLowerCase();
              let blob: Blob | null = null;

              if (!["heic", "heif", "tiff", "tif", "jpg", "jpeg", "png", "webp", "gif"].includes(fileExtension || "")) {
                return { ...img, error: "Unsupported file format" };
              }

              blob = await convertSingleImage(img.file, outputFormat);

              if (blob) {
                setConversionProgress(Math.round(((index + 1) / images.length) * 100));
                return {
                  ...img,
                  converted: {
                    blob,
                    url: URL.createObjectURL(blob),
                  },
                };
              }
              return { ...img, error: "Conversion failed" };
            } catch (err: any) {
              return { ...img, error: err.message };
            }
          })
        );
        setImages(updatedImages);
      }
    } catch (error) {
      setGlobalError("Conversion failed: " + (error as Error).message);
    }

    setIsConverting(false);
  };

  // Extract the conversion logic to a separate function
  const convertSingleImage = async (file: File, format: string): Promise<Blob | null> => {
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    let blob: Blob | null = null;

    // Add GIF creation logic
    if (format === "image/gif" && images.length > 1) {
      blob = await createGif(images.map((img) => img.file));
    } else if (fileExtension === "heic" || fileExtension === "heif") {
      blob = (await heic2any({ blob: file, toType: format })) as Blob;
    } else if (fileExtension === "tiff" || fileExtension === "tif") {
      const arrayBuffer = await file.arrayBuffer();
      const ifds = UTIF.decode(arrayBuffer);
      UTIF.decodeImage(arrayBuffer, ifds[0]);
      const firstPage = ifds[0];
      const rgba = UTIF.toRGBA8(firstPage);
      const canvas = document.createElement("canvas");
      canvas.width = firstPage.width;
      canvas.height = firstPage.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const imageData = ctx.createImageData(firstPage.width, firstPage.height);
        imageData.data.set(rgba);
        ctx.putImageData(imageData, 0, 0);
      }
      blob = await new Promise<Blob | null>((resolve) => {
        // Pass a quality argument to compress
        canvas.toBlob((b) => resolve(b), format, 0.7);
      });
    } else {
      const img = await loadImage(file);
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
      }
      blob = await new Promise<Blob | null>((resolve) => {
        // Pass a quality argument to compress
        canvas.toBlob((b) => resolve(b), format, 0.7);
      });
    }

    return blob;
  };

  // Update the createGif function to handle all image formats
  const createGif = async (images: File[]): Promise<Blob> => {
    try {
      // First convert all images to standard web format (JPEG/PNG)
      const standardizedImages = await Promise.all(
        images.map(async (file) => {
          const fileExtension = file.name.split(".").pop()?.toLowerCase();

          if (fileExtension === "heic" || fileExtension === "heif") {
            const converted = (await heic2any({
              blob: file,
              toType: "image/jpeg",
            })) as Blob;
            return URL.createObjectURL(converted);
          } else if (fileExtension === "tiff" || fileExtension === "tif") {
            const arrayBuffer = await file.arrayBuffer();
            const ifds = UTIF.decode(arrayBuffer);
            UTIF.decodeImage(arrayBuffer, ifds[0]);
            const firstPage = ifds[0];
            const rgba = UTIF.toRGBA8(firstPage);

            const canvas = document.createElement("canvas");
            canvas.width = firstPage.width;
            canvas.height = firstPage.height;
            const ctx = canvas.getContext("2d");

            if (ctx) {
              const imageData = ctx.createImageData(firstPage.width, firstPage.height);
              imageData.data.set(rgba);
              ctx.putImageData(imageData, 0, 0);

              const blob = await new Promise<Blob>((resolve) => {
                canvas.toBlob((b) => resolve(b as Blob), "image/jpeg");
              });
              return URL.createObjectURL(blob);
            }
          }

          // For standard web formats, use directly
          return URL.createObjectURL(file);
        })
      );

      return new Promise((resolve, reject) => {
        gifshot.createGIF(
          {
            images: standardizedImages,
            gifWidth: gifSettings.gifWidth,
            gifHeight: gifSettings.gifHeight,
            interval: gifSettings.interval,
            numFrames: gifSettings.numFrames,
            frameDuration: 1,
            sampleInterval: 10,
            progressCallback: (progress: number) => {
              setConversionProgress(Math.round(progress * 100));
            },
          },
          (obj: any) => {
            // Cleanup URLs
            standardizedImages.forEach((url) => URL.revokeObjectURL(url));

            if (obj.error) {
              reject(new Error(obj.errorMsg));
              return;
            }

            // Convert base64 to blob
            const base64 = obj.image.split(",")[1];
            const blob = new Blob([Buffer.from(base64, "base64")], { type: "image/gif" });
            resolve(blob);
          }
        );
      });
    } catch (error) {
      console.error("GIF creation error:", error);
      throw new Error("Failed to create GIF");
    }
  };

  // Helper function: load an image from a file using URL.createObjectURL
  const loadImage = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => reject(new Error("Failed to load image."));
      img.src = url;
    });
  };

  const downloadAllImages = async () => {
    const convertedImages = images.filter((img) => img.converted && !img.error);

    // For single image, download directly
    if (convertedImages.length === 1) {
      const img = convertedImages[0];
      if (img.converted?.blob) {
        const fileName = `${img.file.name.split(".")[0]}.${outputFormat.split("/")[1]}`;
        if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android)/i)) {
          // Mobile handling
          window.location.href = img.converted.url;
        } else {
          // Desktop handling
          saveAs(img.converted.blob, fileName);
        }
        return;
      }
    }

    // For multiple images, create zip (same as before)
    const zip = new JSZip();
    convertedImages.forEach((img) => {
      if (img.converted?.blob) {
        const fileName = `${img.file.name.split(".")[0]}.${outputFormat.split("/")[1]}`;
        zip.file(fileName, img.converted.blob);
      }
    });

    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `easy-converter-${Date.now()}.zip`);
  };

  const handleDeleteImage = (previewUrl: string) => {
    setSelectedImage(null); // Close modal if open

    setImages((prevImages) => {
      // Find the image to remove
      const imageToDelete = prevImages.find((img) => img.preview === previewUrl);

      if (imageToDelete) {
        // Create a copy of the array without the deleted image
        const newImages = prevImages.filter((img) => img.preview !== previewUrl);

        // Schedule URL cleanup for next tick after state update
        requestAnimationFrame(() => {
          URL.revokeObjectURL(imageToDelete.preview);
          if (imageToDelete.converted) {
            URL.revokeObjectURL(imageToDelete.converted.url);
          }
        });

        return newImages;
      }

      return prevImages;
    });
  };

  return (
    <Container fluid className="p-4">
      <Row className="justify-content-center">
        <Col xs={12} lg={10}>
          <Card className="shadow">
            <Card.Header className="text-center bg-primary text-white">
              <h3 className="mb-0">Easy Convert</h3>
            </Card.Header>

            <Card.Body>
              <Form className="mb-4">
                <div {...getRootProps()} className={`dropzone-area mb-3 ${isDragActive ? "active" : ""}`}>
                  <input {...getInputProps()} />
                  <div className="text-center p-5">
                    {isDragActive ? (
                      <div className="drag-active">
                        <i className="bi bi-cloud-arrow-down-fill fs-1"></i>
                        <p className="mb-0">Drop the files here ...</p>
                      </div>
                    ) : (
                      <div>
                        <i className="bi bi-cloud-arrow-up fs-1"></i>
                        <p className="mb-0">Drag & drop files here, or click to select files</p>
                        <small className="text-muted">Supported formats: JPEG, PNG, GIF, WebP, HEIC, TIFF</small>
                      </div>
                    )}
                  </div>
                </div>

                <div className="select-area mb-3">
                  <Form.Select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)} size="lg">
                    <option value="image/jpeg">JPEG</option>
                    <option value="image/png">PNG</option>
                    <option value="image/webp">WebP</option>
                    <option value="image/gif">GIF</option>
                  </Form.Select>
                </div>

                <Card className="settings-panel mb-5">
                  <Card.Header
                    className="d-flex justify-content-between align-items-center bg-transparent"
                    onClick={() => setShowSettings(!showSettings)}
                    style={{ cursor: "pointer" }}
                  >
                    <span className="text-muted">Advanced Settings</span>
                    <i className={`bi bi-chevron-${showSettings ? "up" : "down"}`}></i>
                  </Card.Header>

                  <Collapse in={showSettings}>
                    <Card.Body>
                      <Form.Group className="mb-3">
                        <Form.Label>Quality ({(compressionSettings.quality * 100).toFixed(0)}%)</Form.Label>
                        <Form.Range
                          value={compressionSettings.quality * 100}
                          step={5}
                          onChange={(e) =>
                            setCompressionSettings((prev) => ({
                              ...prev,
                              quality: Number(e.target.value) / 100,
                            }))
                          }
                          min="10"
                          max="100"
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Check
                          type="switch"
                          id="maintain-size"
                          label="Maintain original dimensions"
                          checked={compressionSettings.maintainSize}
                          onChange={(e) =>
                            setCompressionSettings((prev) => ({
                              ...prev,
                              maintainSize: e.target.checked,
                            }))
                          }
                        />
                      </Form.Group>

                      {!compressionSettings.maintainSize && (
                        <Row>
                          <Col>
                            <Form.Group className="mb-3">
                              <Form.Label>Max Width</Form.Label>
                              <Form.Control
                                type="number"
                                value={compressionSettings.maxWidth}
                                onChange={(e) =>
                                  setCompressionSettings((prev) => ({
                                    ...prev,
                                    maxWidth: Number(e.target.value),
                                  }))
                                }
                              />
                            </Form.Group>
                          </Col>
                          <Col>
                            <Form.Group className="mb-3">
                              <Form.Label>Max Height</Form.Label>
                              <Form.Control
                                type="number"
                                value={compressionSettings.maxHeight}
                                onChange={(e) =>
                                  setCompressionSettings((prev) => ({
                                    ...prev,
                                    maxHeight: Number(e.target.value),
                                  }))
                                }
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                      )}
                    </Card.Body>
                  </Collapse>
                </Card>

                <div className="d-grid">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={convertImages}
                    disabled={images.length === 0 || isConverting}
                  >
                    {isConverting
                      ? `Converting... ${conversionProgress}%`
                      : `Convert ${images.length} Image${images.length !== 1 ? "s" : ""}`}
                  </Button>
                </div>

                <div className="d-grid mt-3">
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={downloadAllImages}
                    disabled={images.filter((im) => im.converted).length === 0 || isConverting}
                  >
                    Download All Converted Images
                  </Button>
                </div>
              </Form>

              {globalError && <Alert variant="danger">{globalError}</Alert>}

              {isUploading && <Alert variant="info">Uploading... {uploadProgress}%</Alert>}

              <Row className="g-4">
                {outputFormat === "image/gif" && images.length > 1 ? (
                  // Show single GIF preview
                  <Col xs={12}>
                    <Card>
                      <Card.Header>
                        <h5 className="mb-0">Animated GIF Preview</h5>
                      </Card.Header>
                      <Card.Body className="text-center">
                        {gifPreview ? (
                          <>
                            <BootstrapImage src={gifPreview} alt="Animated GIF" fluid className="max-width-500" />
                            <Button
                              as="a"
                              href={gifPreview}
                              download="animated.gif"
                              variant="success"
                              size="lg"
                              className="mt-3"
                            >
                              Download GIF
                            </Button>
                          </>
                        ) : (
                          <div className="text-muted">Convert images to see the animated GIF preview</div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                ) : (
                  // Show regular grid of images for other formats
                  images.map((img) => (
                    <Col xs={12} key={`${img.file.name}-${img.file.lastModified}`} className="mb-1">
                      <Card className="card-image">
                        <div className="d-flex align-items-center justify-content-between pr-4">
                          {/* Left: Original image preview */}
                          <div
                            style={{ width: "80px", height: "80px", cursor: "pointer" }}
                            onClick={() => handleOpenModal(img.preview, img)}
                          >
                            <img
                              src={img.preview}
                              alt="Original"
                              style={{ width: "100%", height: "100%", objectFit: "contain" }}
                            />
                          </div>

                          {/* Middle: File info */}
                          <div className="mx-2 flex-grow-1">
                            <small className="text-muted">{img.file.name}</small>
                            <div>
                              <small>
                                {img.file.type?.replace("image/", "").toLocaleUpperCase()} -{" "}
                                {(img.file.size / 1024).toFixed(2)} KB
                              </small>
                            </div>
                            {img.error && <div className="text-danger">{img.error}</div>}
                          </div>

                          {/* Right: Converted image preview */}
                          {img.converted ? (
                            <div
                              style={{ width: "80px", height: "80px", cursor: "pointer" }}
                              onClick={() => handleOpenModal(img.converted!.url, img)}
                            >
                              <img
                                src={img.converted.url}
                                alt="Converted"
                                style={{ width: "100%", height: "100%", objectFit: "contain" }}
                              />
                            </div>
                          ) : (
                            <small className="text-muted">Not converted</small>
                          )}

                          {/* Delete Button */}
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 text-danger text-decoration-none remove-btn-image"
                            onClick={() => handleDeleteImage(img.preview)}
                          >
                            ✕
                          </Button>
                        </div>
                      </Card>
                    </Col>
                  ))
                )}
              </Row>

              {/* Modal for enlarged preview */}
              <Modal size="xl" show={!!selectedImage} onHide={handleCloseModal} centered>
                <Button 
                  variant="link" 
                  onClick={handleCloseModal}
                  className="position-absolute text-danger top-0 end-0 p-3 text-secondary" 
                  style={{ zIndex: 1 }}
                >
                  <i className="bi bi-x-lg"></i>
                </Button>
                <Modal.Body className="text-center">
                  {selectedImage && (
                    <img
                      src={selectedImage.url}
                      alt="Preview"
                      style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain" }}
                    />
                  )}
                </Modal.Body>
                <Modal.Footer>
                  {selectedImage && (
                    <Button
                      variant="primary"
                      className="w-100"
                      onClick={() => {
                        if (selectedImage.fileName && selectedImage.format) {
                          const fileName = `${selectedImage.fileName.split(".")[0]}.${selectedImage.format}`;
                          downloadImage(selectedImage.url, fileName);
                        }
                      }}
                    >
                      <i className="bi bi-download me-2"></i>
                      Download Image
                    </Button>
                  )}
                </Modal.Footer>
              </Modal>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};
