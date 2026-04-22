import { Phone } from "lucide-react";
import { useState, useEffect } from "react";
import SOSModal from "./SOSModal";

interface SOSButtonProps {
  forceOpen?: boolean;
  onModalClose?: () => void;
  stealthMode?: boolean;
}

const SOSButton = ({ forceOpen = false, onModalClose, stealthMode = false }: SOSButtonProps) => {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (forceOpen) setShowModal(true);
  }, [forceOpen]);

  const handleClose = () => {
    setShowModal(false);
    onModalClose?.();
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-sos text-sos-foreground flex items-center justify-center shadow-lg animate-sos-pulse hover:brightness-110 active:scale-95 transition-transform"
        aria-label="Emergency SOS"
      >
        <div className="flex flex-col items-center gap-0.5">
          <Phone className="w-5 h-5" />
          <span className="text-[9px] font-extrabold tracking-wider">SOS</span>
        </div>
      </button>
      {showModal && <SOSModal onClose={handleClose} stealthMode={stealthMode} />}
    </>
  );
};

export default SOSButton;
