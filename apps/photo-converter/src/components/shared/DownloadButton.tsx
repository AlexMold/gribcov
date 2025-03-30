import { Button } from "react-bootstrap";

interface DownloadButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({ onClick, disabled, className = "" }) => (
  <Button
    variant="link"
    size="sm"
    disabled={disabled}
    className={`ms-3 text-primary ${className}`}
    onClick={onClick}
  >
    <i className="bi bi-download"></i>
  </Button>
);