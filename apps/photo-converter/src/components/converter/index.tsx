"use client";
import React, { useState } from "react";
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
import { ImagePreview } from '../shared/ImagePreview';
import { DownloadButton } from '../shared/DownloadButton';
import { downloadImage, loadImage } from '../../utils/imageUtils';
import { DEFAULT_COMPRESSION_SETTINGS } from '../../constants';
import { useLanguage } from '../../contexts/LanguageContext';
import "./converter.scss";
import { interpolate } from "@photo-converter/translations";

const ImageEditor = React.lazy(() => import('../shared/ImageEditor').then(module => ({ default: module.ImageEditor })));

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
  isConverted?: boolean; // Add this line
}

const gifSettings = {
  interval: 0.5, // seconds between frames
  numFrames: 10,
  gifWidth: 800,
  gifHeight: 600,
};

export const Converter: React.FC = () => {
  const { t } = useLanguage();
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
  const [compressionSettings, setCompressionSettings] = 
    useState<CompressionSettings>(DEFAULT_COMPRESSION_SETTINGS);

  const handleOpenModal = (url: string, img?: ImageFile, isConverted = false) => {
    setSelectedImage({
      url,
      fileName: img?.file.name,
      format: outputFormat.split("/")[1],
      isConverted,
    });
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  // Add this helper function
  const createPreviewFromTiff = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const ifds = UTIF.decode(arrayBuffer);
    UTIF.decodeImage(arrayBuffer, ifds[0]);
    const firstPage = ifds[0];
    const rgba = UTIF.toRGBA8(firstPage);

    const canvas = document.createElement("canvas");
    canvas.width = firstPage.width;
    canvas.height = firstPage.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) throw new Error("Could not get canvas context");

    const imageData = ctx.createImageData(firstPage.width, firstPage.height);
    imageData.data.set(rgba);
    ctx.putImageData(imageData, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(URL.createObjectURL(blob));
        } else {
          resolve(URL.createObjectURL(file)); // fallback
        }
      }, "image/jpeg");
    });
  };

  // Update the onDrop function
  const onDrop = async (acceptedFiles: File[]) => {
    setIsUploading(true);
    setUploadProgress(0);

    const total = acceptedFiles.length;
    let completed = 0;

    const newFiles = await Promise.all(
      acceptedFiles.map(async (file) => {
        const fileExtension = file.name.split(".").pop()?.toLowerCase();

        try {
          let preview: string;
          
          if (fileExtension === "tiff" || fileExtension === "tif") {
            preview = await createPreviewFromTiff(file);
          } else if (fileExtension === "heic" || fileExtension === "heif") {
            const previewBlob = await heic2any({
              blob: file,
              toType: "image/jpeg",
            }) as Blob;
            preview = URL.createObjectURL(previewBlob);
          } else {
            preview = URL.createObjectURL(file);
          }

          completed++;
          setUploadProgress(Math.round((completed / total) * 100));
          
          return {
            file,
            preview,
          };
        } catch (err) {
          completed++;
          setUploadProgress(Math.round((completed / total) * 100));
          return {
            file,
            preview: URL.createObjectURL(file),
            error: "Failed to create preview"
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
    <Container fluid className="p-4 mb-4">
      <Row className="justify-content-center">
        <Col xs={12} lg={10}>
          <Card className="shadow mb-2" role="region" aria-label={t('aria.converter')}>
            <Card.Body>
              <Form className="mb-4">
                {/* Replace existing dropzone with this conditional render */}
                <div
                  {...getRootProps()}
                  className={`dropzone-area ${isDragActive ? 'drag-active' : ''} ${images.length > 0 ? 'collapsed' : ''}`}
                  role="button"
                  tabIndex={0}
                  aria-label={t('aria.dropzone')}
                >
                  <input {...getInputProps()} aria-label={t('aria.fileInput')} />
                  {images.length > 0 ? (
                    <Button 
                      variant="outline-primary"
                      className="upload-more-btn"
                    >
                      <i className="bi bi-plus-lg me-2"></i>
                      {t('dropzone.uploadMore')}
                    </Button>
                  ) : (
                    <div className="dropzone-content text-center p-5">
                      {isDragActive ? (
                        <div>
                          <i className="bi bi-cloud-arrow-down-fill fs-1"></i>
                          <p className="mb-0">{t('dropzone.dragActive')}</p>
                        </div>
                      ) : (
                        <div>
                          <i className="bi bi-cloud-arrow-up fs-1"></i>
                          <p className="mb-0">{t('dropzone.dragInactive')}</p>
                          <small className="text-muted d-block mt-2">
                            {t('dropzone.supportedFormats')}
                          </small>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="select-area mb-3">
                  <Form.Select
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value)}
                    size="lg"
                    aria-label={t('aria.outputFormat')}
                  >
                    <option value="image/jpeg">{t('formats.jpeg')}</option>
                    <option value="image/png">{t('formats.png')}</option>
                    <option value="image/webp">{t('formats.webp')}</option>
                    <option value="image/gif">{t('formats.gif')}</option>
                  </Form.Select>
                </div>

                <Card className="settings-panel mb-5">
                  <Card.Header
                    className="d-flex justify-content-between align-items-center bg-transparent"
                    onClick={() => setShowSettings(!showSettings)}
                    style={{ cursor: "pointer" }}
                    role="button"
                    tabIndex={0}
                    aria-expanded={showSettings}
                    aria-controls="settings-panel"
                  >
                    <span className="text-muted">{t('settings.advanced')}</span>
                    <i className={`bi bi-chevron-${showSettings ? "up" : "down"}`} aria-hidden="true"></i>
                  </Card.Header>

                  <Collapse in={showSettings}>
                    <Card.Body>
                      <Form.Group className="mb-3">
                        <Form.Label>{t('settings.quality')} ({(compressionSettings.quality * 100).toFixed(0)}%)</Form.Label>
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
                          label={t('settings.maintainSize')}
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
                              <Form.Label>{t('settings.maxWidth')}</Form.Label>
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
                              <Form.Label>{t('settings.maxHeight')}</Form.Label>
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
                      ? interpolate(t('buttons.converting'), { progress: conversionProgress })
                      : interpolate(t('formats.converting'), {
                          count: images.length,
                          itemLabel: t(`formats.${images.length === 1 ? 'item' : 'items'}`)
                        })}
                  </Button>
                </div>

                <div className="d-grid mt-3">
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={downloadAllImages}
                    disabled={images.filter((im) => im.converted).length === 0 || isConverting}
                  >
                    {t('buttons.download')}
                  </Button>
                </div>
              </Form>

              {globalError && (
                <Alert variant="danger" role="alert">
                  {globalError}
                </Alert>
              )}

              {isUploading && (
                <div role="status" aria-live="polite">
                  {interpolate(t('status.uploading'), { progress: uploadProgress })}
                </div>
              )}

              <Row className="g-4">
                {outputFormat === "image/gif" && images.length > 1 ? (
                  // Show single GIF preview
                  <Col xs={12}>
                    <Card>
                      <Card.Header>
                        <h5 className="mb-0">{t('preview.gifPreview')}</h5>
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
                              {t('buttons.downloadGif')}
                            </Button>
                          </>
                        ) : (
                          <div className="text-muted">{t('preview.convertToSee')}</div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                ) : (
                  // Show regular grid of images for other formats
                  images.map((img) => (
                    <Col xs={12} key={`${img.file.name}-${img.file.lastModified}`} className="mb-1">
                      <Card className="card-image" role="article" aria-label={`Image: ${img.file.name}`}>
                        <div className="d-flex align-items-center justify-content-between pr-4">
                          {/* Left: Original image preview */}
                          <ImagePreview 
                            src={img.preview}
                            alt={`Preview of ${img.file.name}`}
                            onClick={() => handleOpenModal(img.preview, img)}
                          />

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
                            <div className="d-flex align-items-center">
                              <ImagePreview 
                                src={img.converted.url}
                                alt="Converted"
                                onClick={() => handleOpenModal(img.converted!.url, img, true)}
                              />
                              <DownloadButton 
                                onClick={() => {
                                  const fileName = `${img.file.name.split(".")[0]}.${outputFormat.split("/")[1]}`;
                                  downloadImage(img.converted!.url, fileName);
                                }}
                              />
                            </div>
                          ) : (
                            <>
                              <div
                                className="position-relative rounded d-flex align-items-center justify-content-center"
                                style={{
                                  width: "80px",
                                  height: "80px",
                                  border: "1px dashed #dee2e6",
                                  borderRadius: "4px",
                                  backgroundColor: "#f8f9fa",
                                  overflow: "hidden",
                                }}
                                role="presentation"
                              >
                                <div className="position-absolute" style={{ opacity: 0.6 }}>
                                  <img
                                    src={img.preview}
                                    alt=""
                                    style={{
                                      width: "80px",
                                      height: "80px",
                                      objectFit: "contain",
                                      filter: "blur(2px) grayscale(100%)",
                                    }}
                                  />
                                </div>
                                <div className="position-relative text-center">
                                  <small className="d-block text-white text-info fw-bold" style={{ fontSize: "0.75rem", textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}>
                                    {outputFormat.split("/")[1].toUpperCase()}
                                  </small>
                                </div>
                              </div>
                              <DownloadButton 
                                disabled
                                onClick={() => {}}
                              />
                            </>
                          )}

                          {/* Delete Button */}
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 text-danger text-decoration-none remove-btn-image"
                            onClick={() => handleDeleteImage(img.preview)}
                            aria-label={`Remove ${img.file.name}`}
                          >
                            <i className="bi bi-x-lg" aria-hidden="true"></i>
                          </Button>
                        </div>
                      </Card>
                    </Col>
                  ))
                )}
              </Row>

              {/* Modal for enlarged preview */}
              <Modal 
                size="xl" 
                show={!!selectedImage} 
                onHide={handleCloseModal} 
                centered 
                fullscreen 
                aria-label={t('aria.preview')}
              >
                <Modal.Header closeButton>
                  <Modal.Title>{selectedImage?.fileName}</Modal.Title>
                </Modal.Header>
                
                <Modal.Body className="p-0">
                  <div className="d-flex h-100">
                    {selectedImage && (
                      <ImageEditor
                        imageUrl={selectedImage.url}
                        onSave={(editedUrl) => {
                          setImages((prev) => {
                            const updatedImages = prev.map((img) => {
                              if (img.file.name === selectedImage.fileName) {
                                return {
                                  ...img,
                                  converted: {
                                    blob: img.converted?.blob,
                                    url: editedUrl,
                                  },
                                };
                              }
                              return img;
                            });
                            return updatedImages as ImageFile[];
                          })
                        }}
                      />
                    )}
                  </div>
                </Modal.Body>

                <Modal.Footer>
                  <Button variant="secondary" onClick={handleCloseModal}>
                    {t('buttons.close')}
                  </Button>
                  {selectedImage?.isConverted && (
                    <Button
                      variant="primary"
                      onClick={() => {
                        if (selectedImage.fileName && selectedImage.format) {
                          const fileName = `${selectedImage.fileName.split(".")[0]}.${selectedImage.format}`;
                          downloadImage(selectedImage.url, fileName);
                        }
                      }}
                    >
                      <i className="bi bi-download me-2"></i>
                      {t('buttons.download')}
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
