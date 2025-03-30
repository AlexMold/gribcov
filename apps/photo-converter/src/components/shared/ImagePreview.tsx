import { Button } from "react-bootstrap";

interface ImagePreviewProps {
  src: string;
  alt: string;
  onClick?: () => void;
  className?: string;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ src, alt, onClick, className = "" }) => (
  <Button
    variant="link"
    className={`p-0 border-0 ${className}`}
    onClick={onClick}
    aria-label={`Preview ${alt}`}
  >
    <img
      src={src}
      alt={alt}
      style={{ width: "80px", height: "80px", objectFit: "contain" }}
    />
  </Button>
);