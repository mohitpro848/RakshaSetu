import { useState, useEffect, useRef } from "react";
import { ArrowLeft, User, Camera, Phone, Save, Loader2, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

interface ProfileSettingsProps {
  onBack: () => void;
}

const ProfileSettings = ({ onBack }: ProfileSettingsProps) => {
  const { t } = useI18n();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, phone_number, avatar_url")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setDisplayName(data.display_name || "");
        setPhoneNumber(data.phone_number || "");
        setAvatarUrl(data.avatar_url);
      } else {
        // Fallback from auth metadata
        setDisplayName(
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] || ""
        );
      }
      setLoading(false);
    })();
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error("Upload failed");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const newUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    setAvatarUrl(newUrl);

    await supabase
      .from("profiles")
      .update({ avatar_url: newUrl })
      .eq("user_id", user.id);

    setUploading(false);
    toast.success("Avatar updated!");
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const trimmedName = displayName.trim().slice(0, 100);
    const trimmedPhone = phoneNumber.trim().slice(0, 20);

    const { error } = await supabase
      .from("profiles")
      .upsert({
        user_id: user.id,
        display_name: trimmedName,
        phone_number: trimmedPhone,
        avatar_url: avatarUrl,
      }, { onConflict: "user_id" });

    if (error) {
      toast.error("Failed to save profile");
    } else {
      setSaved(true);
      toast.success("Profile saved!");
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container flex items-center gap-3 h-14 px-4">
          <button onClick={onBack} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <User className="w-5 h-5 text-primary" />
          <h1 className="text-sm font-bold text-foreground">Edit Profile</h1>
        </div>
      </header>

      <main className="container px-4 py-6 max-w-md mx-auto space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg shadow-primary/10 bg-muted">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  <User className="w-10 h-10 text-primary/50" />
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:brightness-110 active:scale-95 transition-all border-2 border-background"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
          <p className="text-xs text-muted-foreground">Tap camera to change photo</p>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Display Name */}
          <div className="bg-card rounded-xl border border-border p-4 space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={100}
              placeholder="Your name"
              className="w-full h-11 px-4 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          {/* Phone Number */}
          <div className="bg-card rounded-xl border border-border p-4 space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                maxLength={20}
                placeholder="+91 XXXXX XXXXX"
                className="w-full h-11 pl-10 pr-4 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
          </div>

          {/* Email (read-only) */}
          <div className="bg-card rounded-xl border border-border p-4 space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full h-11 px-4 rounded-lg border border-border bg-muted/50 text-sm text-muted-foreground cursor-not-allowed"
            />
            <p className="text-[10px] text-muted-foreground">Email cannot be changed</p>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Saving..." : saved ? "Saved!" : "Save Profile"}
        </button>
      </main>
    </div>
  );
};

export default ProfileSettings;
