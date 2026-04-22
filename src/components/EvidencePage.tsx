import { ArrowLeft, Shield } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import DigitalEvidence from "@/components/DigitalEvidence";

interface EvidencePageProps {
  onBack: () => void;
}

const EvidencePage = ({ onBack }: EvidencePageProps) => {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-muted/50">
      <header className="bg-card border-b border-border">
        <div className="container flex items-center gap-3 h-14 px-4">
          <button onClick={onBack} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="text-sm font-bold text-foreground">Digital Evidence</h1>
        </div>
      </header>

      <main className="container px-4 py-5 space-y-5">
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-sm text-muted-foreground mb-4">
            Capture and securely upload photo, video, or audio evidence. All files are stored securely with location and timestamp metadata.
          </p>
          <DigitalEvidence />
        </div>
      </main>
    </div>
  );
};

export default EvidencePage;
