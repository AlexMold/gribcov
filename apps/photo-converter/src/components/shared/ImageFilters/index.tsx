import React, { useState } from "react";
import { Button, Form, Card, Accordion } from "react-bootstrap";
import { filters as FabricFilters, FabricImage } from "fabric";
import { useLanguage } from "../../../contexts/LanguageContext";

export const DEFAULT_FILTER_VALUES = {
  grayscale: 0,
  sepia: 0,
  invert: false,
  blur: 0,
  brightness: 0,
  contrast: 0,
  saturation: 0,
  noise: 0,
  pixelate: 0,
  sharpen: 0,
  emboss: 0,
};

interface ImageFiltersProps {
  image: FabricImage | null;
  onRenderCanvas: () => void;
}

export const ImageFilters: React.FC<ImageFiltersProps> = ({ image, onRenderCanvas }) => {
  const { t } = useLanguage();
  const [showFilters, setShowFilters] = useState(false);
  const [isFiltersModified, setIsFiltersModified] = useState(false);
  const [filterValues, setFilterValues] = useState(DEFAULT_FILTER_VALUES);

  const handleFilterChange = (filterName: string, value: number | boolean) => {
    if (!image) return;

    setFilterValues((prev) => {
      const newValues = {
        ...prev,
        [filterName]: value,
      };

      // Check if any filter differs from default
      const hasModifications = Object.entries(newValues).some(
        ([key, val]) => val !== DEFAULT_FILTER_VALUES[key as keyof typeof DEFAULT_FILTER_VALUES]
      );

      // Update modification state only if it changed
      if (hasModifications !== isFiltersModified) {
        setIsFiltersModified(hasModifications);
      }

      return newValues;
    });

    // Create a new array of filters based on current values
    const activeFilters = [];
    
    const normalizedValues = {
      ...filterValues,
      [filterName]: value,
    };

    if (normalizedValues.grayscale > 0) {
      activeFilters.push(new FabricFilters.Grayscale({ 
        grayscale: normalizedValues.grayscale / 100 
      }));
    }
    
    if (normalizedValues.sepia > 0) {
      activeFilters.push(new FabricFilters.Sepia({ 
        sepia: normalizedValues.sepia / 100 
      }));
    }
    
    if (normalizedValues.invert) {
      activeFilters.push(new FabricFilters.Invert());
    }
    
    if (normalizedValues.blur > 0) {
      activeFilters.push(new FabricFilters.Blur({ 
        blur: normalizedValues.blur / 200 
      }));
    }
    
    if (normalizedValues.brightness > 0) {
      activeFilters.push(new FabricFilters.Brightness({ 
        brightness: (normalizedValues.brightness - 50) / 50 
      }));
    }
    
    if (normalizedValues.contrast > 0) {
      activeFilters.push(new FabricFilters.Contrast({ 
        contrast: (normalizedValues.contrast - 50) / 50 
      }));
    }
    
    if (normalizedValues.saturation > 0) {
      activeFilters.push(new FabricFilters.Saturation({ 
        saturation: (normalizedValues.saturation - 50) / 50 
      }));
    }
    
    if (normalizedValues.noise > 0) {
      activeFilters.push(new FabricFilters.Noise({ 
        noise: normalizedValues.noise * 2 
      }));
    }
    
    if (normalizedValues.pixelate > 0) {
      activeFilters.push(new FabricFilters.Pixelate({ 
        blocksize: Math.max(2, normalizedValues.pixelate / 10) 
      }));
    }
    
    if (normalizedValues.sharpen > 0) {
      const intensity = normalizedValues.sharpen / 50;
      activeFilters.push(new FabricFilters.Convolute({
        matrix: [0, -intensity, 0, -intensity, 1 + 4 * intensity, -intensity, 0, -intensity, 0],
      }));
    }
    
    if (normalizedValues.emboss > 0) {
      const intensity = normalizedValues.emboss / 100;
      activeFilters.push(new FabricFilters.Convolute({
        matrix: [intensity, intensity, intensity, intensity, 1 - intensity, -intensity, -intensity, -intensity, -intensity],
      }));
    }

    // Apply filters
    image.filters = activeFilters;
    image.applyFilters();
    onRenderCanvas();
  };

  const resetFilters = () => {
    setFilterValues(DEFAULT_FILTER_VALUES);
    setIsFiltersModified(false);

    if (image) {
      image.filters = [];
      image.applyFilters();
      onRenderCanvas();
    }
  };

  return (
    <div className="mb-4">
      <h6 
        className="d-flex justify-content-between align-items-center"
        onClick={() => setShowFilters(!showFilters)}
        style={{ cursor: "pointer" }}
      >
        {t("editor.filters")}
        <i className={`bi bi-chevron-${showFilters ? 'up' : 'down'}`}></i>
      </h6>
      
      <Card className={`filter-controls ${showFilters ? '' : 'd-none'}`}>
        <Card.Body>
          <div className="d-flex justify-content-center mb-3">
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={resetFilters}
              disabled={!isFiltersModified}
            >
              {t("editor.resetFilters")}
            </Button>
          </div>
          
          <Accordion>
            <Accordion.Item eventKey="0">
              <Accordion.Header>{t("editor.colorFilters")}</Accordion.Header>
              <Accordion.Body>
                <div className="mb-3">
                  <Form.Label className="d-flex justify-content-between">
                    <span>{t("editor.grayscale")}</span>
                    <span>{filterValues.grayscale}%</span>
                  </Form.Label>
                  <Form.Range
                    value={filterValues.grayscale}
                    onChange={(e) => handleFilterChange("grayscale", Number(e.target.value))}
                    min="0"
                    max="100"
                  />
                </div>
                
                <div className="mb-3">
                  <Form.Label className="d-flex justify-content-between">
                    <span>{t("editor.sepia")}</span>
                    <span>{filterValues.sepia}%</span>
                  </Form.Label>
                  <Form.Range
                    value={filterValues.sepia}
                    onChange={(e) => handleFilterChange("sepia", Number(e.target.value))}
                    min="0"
                    max="100"
                  />
                </div>
                
                <div className="mb-3">
                  <Form.Check
                    type="switch"
                    id="invert-switch"
                    label={t("editor.invert")}
                    checked={filterValues.invert}
                    onChange={(e) => handleFilterChange("invert", e.target.checked)}
                  />
                </div>
              </Accordion.Body>
            </Accordion.Item>
            
            <Accordion.Item eventKey="1">
              <Accordion.Header>{t("editor.adjustments")}</Accordion.Header>
              <Accordion.Body>
                <div className="mb-3">
                  <Form.Label className="d-flex justify-content-between">
                    <span>{t("editor.brightness")}</span>
                    <span>{filterValues.brightness}%</span>
                  </Form.Label>
                  <Form.Range
                    value={filterValues.brightness}
                    onChange={(e) => handleFilterChange("brightness", Number(e.target.value))}
                    min="0"
                    max="100"
                    defaultValue="50"
                  />
                </div>
                
                <div className="mb-3">
                  <Form.Label className="d-flex justify-content-between">
                    <span>{t("editor.contrast")}</span>
                    <span>{filterValues.contrast}%</span>
                  </Form.Label>
                  <Form.Range
                    value={filterValues.contrast}
                    onChange={(e) => handleFilterChange("contrast", Number(e.target.value))}
                    min="0"
                    max="100"
                    defaultValue="50"
                  />
                </div>
                
                <div className="mb-3">
                  <Form.Label className="d-flex justify-content-between">
                    <span>{t("editor.saturation")}</span>
                    <span>{filterValues.saturation}%</span>
                  </Form.Label>
                  <Form.Range
                    value={filterValues.saturation}
                    onChange={(e) => handleFilterChange("saturation", Number(e.target.value))}
                    min="0"
                    max="100"
                    defaultValue="50"
                  />
                </div>
              </Accordion.Body>
            </Accordion.Item>
            
            <Accordion.Item eventKey="2">
              <Accordion.Header>{t("editor.effects")}</Accordion.Header>
              <Accordion.Body>
                <div className="mb-3">
                  <Form.Label className="d-flex justify-content-between">
                    <span>{t("editor.blur")}</span>
                    <span>{filterValues.blur}%</span>
                  </Form.Label>
                  <Form.Range
                    value={filterValues.blur}
                    onChange={(e) => handleFilterChange("blur", Number(e.target.value))}
                    min="0"
                    max="100"
                  />
                </div>
                
                <div className="mb-3">
                  <Form.Label className="d-flex justify-content-between">
                    <span>{t("editor.noise")}</span>
                    <span>{filterValues.noise}%</span>
                  </Form.Label>
                  <Form.Range
                    value={filterValues.noise}
                    onChange={(e) => handleFilterChange("noise", Number(e.target.value))}
                    min="0"
                    max="100"
                  />
                </div>
                
                <div className="mb-3">
                  <Form.Label className="d-flex justify-content-between">
                    <span>{t("editor.pixelate")}</span>
                    <span>{filterValues.pixelate}%</span>
                  </Form.Label>
                  <Form.Range
                    value={filterValues.pixelate}
                    onChange={(e) => handleFilterChange("pixelate", Number(e.target.value))}
                    min="0"
                    max="100"
                  />
                </div>
                
                <div className="mb-3">
                  <Form.Label className="d-flex justify-content-between">
                    <span>{t("editor.sharpen")}</span>
                    <span>{filterValues.sharpen}%</span>
                  </Form.Label>
                  <Form.Range
                    value={filterValues.sharpen}
                    onChange={(e) => handleFilterChange("sharpen", Number(e.target.value))}
                    min="0"
                    max="100"
                  />
                </div>
                
                <div className="mb-3">
                  <Form.Label className="d-flex justify-content-between">
                    <span>{t("editor.emboss")}</span>
                    <span>{filterValues.emboss}%</span>
                  </Form.Label>
                  <Form.Range
                    value={filterValues.emboss}
                    onChange={(e) => handleFilterChange("emboss", Number(e.target.value))}
                    min="0"
                    max="100"
                  />
                </div>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </Card.Body>
      </Card>
    </div>
  );
};