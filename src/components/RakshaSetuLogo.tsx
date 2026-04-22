import { Shield } from "lucide-react";
import rakshaLogo from "@/assets/raksha-setu-logo.jpg";

interface RakshaSetuLogoProps {
  size?: number;
  className?: string;
}

const RakshaSetuLogo = ({ size = 44, className = "" }: RakshaSetuLogoProps) => (
  <img
    src={rakshaLogo}
    alt="RakshaSetu Logo"
    width={size}
    height={size}
    className={`object-contain flex-shrink-0 ${className}`}
    onError={(e) => {
      // Fallback: hide broken image, show nothing (parent can provide fallback)
      (e.target as HTMLImageElement).style.display = "none";
    }}
  />
);

export default RakshaSetuLogo;
