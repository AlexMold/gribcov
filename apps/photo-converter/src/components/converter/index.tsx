'use client';
import React, { useState, useEffect } from 'react';
import heic2any from 'heic2any';
import UTIF from 'utif';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
// @ts-ignore
import gifshot from 'gifshot';
import { 
  Container, 
  Row, 
  Col, 
  Form, 
  Button, 
  Alert, 
  Card,
  Image as BootstrapImage,
} from "react-bootstrap";

interface ImageFile {
  file: File;
  preview: string;
  converted?: {
    blob: Blob;
    url: string;
  };
  error?: string;
}

export const Converter: React.FC = () => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [outputFormat, setOutputFormat] = useState<string>('image/jpeg');
  const [globalError, setGlobalError] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [gifSettings, setGifSettings] = useState({
    interval: 0.5, // seconds between frames
    numFrames: 10,
    gifWidth: 800,
    gifHeight: 600,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [gifPreview, setGifPreview] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setIsUploading(true);
      setUploadProgress(0);
      
      const files = Array.from(event.target.files);
      const total = files.length;
      let completed = 0;
  
      const newFiles = await Promise.all(
        files.map(async (file) => {
          const fileExtension = file.name.split('.').pop()?.toLowerCase();
          
          try {
            let result;
            if (fileExtension === 'heic' || fileExtension === 'heif') {
              const previewBlob = await heic2any({
                blob: file,
                toType: 'image/jpeg'
              }) as Blob;
              result = {
                file,
                preview: URL.createObjectURL(previewBlob)
              };
            } else {
              result = {
                file,
                preview: URL.createObjectURL(file)
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
              preview: URL.createObjectURL(file)
            };
          }
        })
      );
      
      setImages(prev => [...prev, ...newFiles]);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const convertImages = async () => {
    setIsConverting(true);
    setGifPreview(null); // Reset GIF preview
    
    try {
      if (outputFormat === 'image/gif' && images.length > 1) {
        // For GIF conversion of multiple images
        const blob = await createGif(images.map(img => img.file));
        const gifUrl = URL.createObjectURL(blob);
        setGifPreview(gifUrl);
        
        // Update all images with the same converted GIF
        const updatedImages = images.map(img => ({
          ...img,
          converted: {
            blob,
            url: gifUrl
          }
        }));
        setImages(updatedImages);
      } else {
        // Regular conversion for other formats
        const updatedImages = await Promise.all(
          images.map(async (img, index) => {
            try {
              const fileExtension = img.file.name.split('.').pop()?.toLowerCase();
              let blob: Blob | null = null;
    
              if (!['heic', 'heif', 'tiff', 'tif', 'jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fileExtension || '')) {
                return { ...img, error: 'Unsupported file format' };
              }
    
              blob = await convertSingleImage(img.file, outputFormat);
    
              if (blob) {
                setConversionProgress(Math.round(((index + 1) / images.length) * 100));
                return {
                  ...img,
                  converted: {
                    blob,
                    url: URL.createObjectURL(blob)
                  }
                };
              }
              return { ...img, error: 'Conversion failed' };
            } catch (err: any) {
              return { ...img, error: err.message };
            }
          })
        );
        setImages(updatedImages);
      }
    } catch (error) {
      setGlobalError('Conversion failed: ' + (error as Error).message);
    }
    
    setIsConverting(false);
  };

  // Extract the conversion logic to a separate function
  const convertSingleImage = async (file: File, format: string): Promise<Blob | null> => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    let blob: Blob | null = null;

    // Add GIF creation logic
    if (format === 'image/gif' && images.length > 1) {
      blob = await createGif(images.map(img => img.file));
    } else if (fileExtension === 'heic' || fileExtension === 'heif') {
      blob = await heic2any({ blob: file, toType: format }) as Blob;
    } else if (fileExtension === 'tiff' || fileExtension === 'tif') {
      const arrayBuffer = await file.arrayBuffer();
      const ifds = UTIF.decode(arrayBuffer);
      UTIF.decodeImage(arrayBuffer, ifds[0]);
      const firstPage = ifds[0];
      const rgba = UTIF.toRGBA8(firstPage);
      const canvas = document.createElement('canvas');
      canvas.width = firstPage.width;
      canvas.height = firstPage.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const imageData = ctx.createImageData(firstPage.width, firstPage.height);
        imageData.data.set(rgba);
        ctx.putImageData(imageData, 0, 0);
      }
      blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), format);
      });
    } else {
      const img = await loadImage(file);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
      }
      blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), format);
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
          const fileExtension = file.name.split('.').pop()?.toLowerCase();
          
          if (fileExtension === 'heic' || fileExtension === 'heif') {
            const converted = await heic2any({
              blob: file,
              toType: 'image/jpeg'
            }) as Blob;
            return URL.createObjectURL(converted);
          } else if (fileExtension === 'tiff' || fileExtension === 'tif') {
            const arrayBuffer = await file.arrayBuffer();
            const ifds = UTIF.decode(arrayBuffer);
            UTIF.decodeImage(arrayBuffer, ifds[0]);
            const firstPage = ifds[0];
            const rgba = UTIF.toRGBA8(firstPage);
            
            const canvas = document.createElement('canvas');
            canvas.width = firstPage.width;
            canvas.height = firstPage.height;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
              const imageData = ctx.createImageData(firstPage.width, firstPage.height);
              imageData.data.set(rgba);
              ctx.putImageData(imageData, 0, 0);
              
              const blob = await new Promise<Blob>((resolve) => {
                canvas.toBlob((b) => resolve(b as Blob), 'image/jpeg');
              });
              return URL.createObjectURL(blob);
            }
          }
          
          // For standard web formats, use directly
          return URL.createObjectURL(file);
        })
      );

      return new Promise((resolve, reject) => {
        gifshot.createGIF({
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
        }, (obj: any) => {
          // Cleanup URLs
          standardizedImages.forEach(url => URL.revokeObjectURL(url));
          
          if (obj.error) {
            reject(new Error(obj.errorMsg));
            return;
          }
          
          // Convert base64 to blob
          const base64 = obj.image.split(',')[1];
          const blob = new Blob([Buffer.from(base64, 'base64')], { type: 'image/gif' });
          resolve(blob);
        });
      });
    } catch (error) {
      console.error('GIF creation error:', error);
      throw new Error('Failed to create GIF');
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

  // Cleanup function for URLs
  useEffect(() => {
    return () => {
      images.forEach(img => {
        URL.revokeObjectURL(img.preview);
        if (img.converted) {
          URL.revokeObjectURL(img.converted.url);
        }
      });
      if (gifPreview) {
        URL.revokeObjectURL(gifPreview);
      }
    };
  }, [images, gifPreview]);


  // Add this function inside your component
  const downloadAllImages = async () => {
    const zip = new JSZip();
    
    // Only include successfully converted images
    const convertedImages = images.filter(img => img.converted && !img.error);
    
    convertedImages.forEach((img, index) => {
      if (img.converted?.blob) {
        const fileName = `${img.file.name.split('.')[0]}.${outputFormat.split('/')[1]}`;
        zip.file(fileName, img.converted.blob);
      }
    });
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `converted-images.zip`);
  };

  return (
    <Container fluid className="p-4">
      <Row className="justify-content-center">
        <Col xs={12} lg={10}>
          <Card className="shadow">
            <Card.Header className="text-center bg-primary text-white">
              <h3 className="mb-0">Batch Image Converter</h3>
            </Card.Header>
            
            <Card.Body>
              <Alert variant="info" className="text-center">
                Select multiple images to convert
              </Alert>

              <Form className="mb-4">
                <Form.Group className="mb-3">
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    multiple
                    size="lg"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Select 
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value)}
                    size="lg"
                  >
                    <option value="image/jpeg">JPEG</option>
                    <option value="image/png">PNG</option>
                    <option value="image/webp">WebP</option>
                    <option value="image/gif">GIF (static)</option>
                  </Form.Select>
                </Form.Group>

                <div className="d-grid">
                  <Button 
                    variant="primary" 
                    size="lg"
                    onClick={convertImages}
                    disabled={images.length === 0 || isConverting}
                  >
                    {isConverting ? `Converting... ${conversionProgress}%` : `Convert ${images.length} Image${images.length !== 1 ? 's' : ''}`}
                  </Button>
                </div>

                <div className="d-grid mt-2">
                  <Button 
                    variant="secondary" 
                    size="lg"
                    onClick={downloadAllImages}
                    disabled={images.filter(im => im.converted).length === 0 || isConverting}
                  >
                    Download All Converted Images
                  </Button>
                </div>
              </Form>

              {globalError && (
                <Alert variant="danger">
                  {globalError}
                </Alert>
              )}

              {isUploading && (
                <Alert variant="info">
                  Uploading... {uploadProgress}%
                </Alert>
              )}

              <Row className="g-4">
                {outputFormat === 'image/gif' && images.length > 1 ? (
                  // Show single GIF preview
                  <Col xs={12}>
                    <Card>
                      <Card.Header>
                        <h5 className="mb-0">Animated GIF Preview</h5>
                      </Card.Header>
                      <Card.Body className="text-center">
                        {gifPreview ? (
                          <>
                            <BootstrapImage
                              src={gifPreview}
                              alt="Animated GIF"
                              fluid
                              className="max-width-500"
                            />
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
                          <div className="text-muted">
                            Convert images to see the animated GIF preview
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                ) : (
                  // Show regular grid of images for other formats
                  images.map((img, index) => (
                    <Col xs={12} md={6} lg={4} key={`${img.file.lastModified}-${img.file.name}`}>
                      <Card>
                        <Card.Header className="d-flex justify-content-between align-items-center">
                          <small className="text-muted">{img.file.name}</small>
                          <Button 
                            variant="link" 
                            className="p-0 text-danger text-decoration-none"
                            onClick={() => {
                              URL.revokeObjectURL(img.preview);
                              if (img.converted) URL.revokeObjectURL(img.converted.url);
                              setImages(prev => prev.filter((_, i) => i !== index));
                            }}
                          >
                            ✕
                          </Button>
                        </Card.Header>
                        <Card.Body>
                          <div className="d-flex gap-2">
                            <div className="w-50">
                              <small className="d-block text-muted mb-1">Original</small>
                              <BootstrapImage
                                src={img.preview}
                                alt="Original"
                                fluid
                                className="max-width-100"
                              />
                            </div>
                            {img.converted && (
                              <div className="w-50">
                                <small className="d-block text-muted mb-1">Converted</small>
                                <BootstrapImage
                                  src={img.converted.url}
                                  alt="Converted"
                                  fluid
                                  className="max-width-100"
                                />
                                <Button 
                                  as="a"
                                  href={img.converted.url}
                                  download={`${img.file.name.split('.')[0]}.${outputFormat.split('/')[1]}`}
                                  variant="success"
                                  size="sm"
                                  className="mt-2 w-100"
                                >
                                  Download
                                </Button>
                              </div>
                            )}
                          </div>
                          {img.error && (
                            <Alert variant="danger" className="mt-2 mb-0">
                              {img.error}
                            </Alert>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  ))
                )}
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};
