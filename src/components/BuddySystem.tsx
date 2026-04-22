import { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowLeft,
  Users,
  Copy,
  Check,
  Send,
  MapPin,
  Clock,
  AlertTriangle,
  Shield,
  UserPlus,
  Timer,
  Bell,
  MessageCircle,
  Navigation,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

type SessionStatus = "waiting" | "active" | "ended";
type View = "home" | "session";

interface BuddySession {
  id: string;
  session_code: string;
  creator_id: string;
  buddy_id: string | null;
  creator_name: string | null;
  buddy_name: string | null;
  status: SessionStatus;
  check_in_interval: number;
  last_check_in: string | null;
  creator_lat: number | null;
  creator_lng: number | null;
  buddy_lat: number | null;
  buddy_lng: number | null;
  destination: string | null;
  created_at: string;
}

interface BuddyMessage {
  id: string;
  session_id: string;
  sender_id: string;
  sender_name: string | null;
  message: string;
  message_type: string;
  created_at: string;
}

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function BuddySystem() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [view, setView] = useState<View>("home");
  const [session, setSession] = useState<BuddySession | null>(null);
  const [messages, setMessages] = useState<BuddyMessage[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [destination, setDestination] = useState("");
  const [checkInInterval, setCheckInInterval] = useState(15);
  const [checkInCountdown, setCheckInCountdown] = useState<number | null>(null);
  const [displayName, setDisplayName] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const watchIdRef = useRef<number | null>(null);

  // Fetch display name
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        setDisplayName(data?.display_name || user.email?.split("@")[0] || "User");
      });
  }, [user]);

  // Auto-scroll messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Location tracking
  const startLocationTracking = useCallback(
    (sessionId: string, isCreator: boolean) => {
      if (!navigator.geolocation) return;
      const id = navigator.geolocation.watchPosition(
        async (pos) => {
          const updateField = isCreator
            ? { creator_lat: pos.coords.latitude, creator_lng: pos.coords.longitude }
            : { buddy_lat: pos.coords.latitude, buddy_lng: pos.coords.longitude };
          await supabase.from("buddy_sessions").update(updateField).eq("id", sessionId);
        },
        undefined,
        { enableHighAccuracy: true, maximumAge: 5000 }
      );
      watchIdRef.current = id;
    },
    []
  );

  const stopLocationTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // Realtime subscriptions
  useEffect(() => {
    if (!session) return;

    const sessionChannel = supabase
      .channel(`buddy-session-${session.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "buddy_sessions", filter: `id=eq.${session.id}` },
        (payload) => {
          setSession(payload.new as BuddySession);
        }
      )
      .subscribe();

    const msgChannel = supabase
      .channel(`buddy-messages-${session.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "buddy_messages", filter: `session_id=eq.${session.id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as BuddyMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(msgChannel);
    };
  }, [session?.id]);

  // Check-in countdown timer
  useEffect(() => {
    if (!session || session.status !== "active" || !session.last_check_in) return;

    const interval = setInterval(() => {
      const lastCheckIn = new Date(session.last_check_in!).getTime();
      const nextCheckIn = lastCheckIn + session.check_in_interval * 60 * 1000;
      const remaining = Math.max(0, Math.floor((nextCheckIn - Date.now()) / 1000));
      setCheckInCountdown(remaining);

      if (remaining === 0) {
        toast.warning("Check-in required! Your buddy is waiting.", { duration: 10000 });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session?.status, session?.last_check_in, session?.check_in_interval]);

  // Create session
  const handleCreate = async () => {
    if (!user) return;
    setLoading(true);
    const code = generateCode();
    const { data, error } = await supabase
      .from("buddy_sessions")
      .insert({
        session_code: code,
        creator_id: user.id,
        creator_name: displayName,
        check_in_interval: checkInInterval,
        destination: destination || null,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create session");
      setLoading(false);
      return;
    }

    setSession(data as BuddySession);
    setView("session");
    startLocationTracking(data.id, true);
    setLoading(false);
  };

  // Join session
  const handleJoin = async () => {
    if (!user || !joinCode.trim()) return;
    setLoading(true);

    const { data: existing, error: findErr } = await supabase
      .rpc("get_buddy_session_by_code", { _code: joinCode.trim().toUpperCase() })
      .maybeSingle();

    if (findErr || !existing) {
      toast.error("Session not found or already active");
      setLoading(false);
      return;
    }

    const { error: updateErr } = await supabase
      .from("buddy_sessions")
      .update({
        buddy_id: user.id,
        buddy_name: displayName,
        status: "active",
        last_check_in: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (updateErr) {
      toast.error("Failed to join session");
      setLoading(false);
      return;
    }

    const updatedSession = {
      ...existing,
      buddy_id: user.id,
      buddy_name: displayName,
      status: "active" as SessionStatus,
      last_check_in: new Date().toISOString(),
    } as BuddySession;

    setSession(updatedSession);
    setView("session");
    startLocationTracking(existing.id, false);

    // Send system message
    await supabase.from("buddy_messages").insert({
      session_id: existing.id,
      sender_id: user.id,
      sender_name: displayName,
      message: `${displayName} joined as your buddy! 🤝`,
      message_type: "check_in",
    });

    setLoading(false);
  };

  // Send message
  const handleSend = async () => {
    if (!msgInput.trim() || !session || !user) return;
    const msg = msgInput.trim();
    setMsgInput("");
    await supabase.from("buddy_messages").insert({
      session_id: session.id,
      sender_id: user.id,
      sender_name: displayName,
      message: msg,
      message_type: "text",
    });
  };

  // Check in
  const handleCheckIn = async () => {
    if (!session || !user) return;
    await supabase
      .from("buddy_sessions")
      .update({ last_check_in: new Date().toISOString() })
      .eq("id", session.id);

    await supabase.from("buddy_messages").insert({
      session_id: session.id,
      sender_id: user.id,
      sender_name: displayName,
      message: `✅ ${displayName} checked in — all safe!`,
      message_type: "check_in",
    });

    toast.success("Checked in successfully!");
  };

  // Send alert
  const handleAlert = async () => {
    if (!session || !user) return;
    await supabase.from("buddy_messages").insert({
      session_id: session.id,
      sender_id: user.id,
      sender_name: displayName,
      message: `🚨 ${displayName} needs help! Sending alert!`,
      message_type: "alert",
    });
    toast.error("Alert sent to your buddy!", { duration: 5000 });
  };

  // End session
  const handleEnd = async () => {
    if (!session) return;
    await supabase
      .from("buddy_sessions")
      .update({ status: "ended", ended_at: new Date().toISOString() })
      .eq("id", session.id);
    stopLocationTracking();
    setSession(null);
    setMessages([]);
    setView("home");
    toast.success("Buddy session ended safely.");
  };

  // Copy code
  const handleCopy = () => {
    if (!session) return;
    navigator.clipboard.writeText(session.session_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const isCreator = session?.creator_id === user?.id;
  const partnerName = isCreator ? session?.buddy_name : session?.creator_name;
  const partnerLat = isCreator ? session?.buddy_lat : session?.creator_lat;
  const partnerLng = isCreator ? session?.buddy_lng : session?.creator_lng;

  // ——— HOME VIEW ———
  if (view === "home") {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/" })}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Users className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">Buddy System</h1>
        </div>

        <div className="p-4 space-y-6 max-w-md mx-auto">
          {/* Hero */}
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Walk Together, Stay Safe</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Share your live location with a trusted companion and check in along the way.
            </p>
          </div>

          {/* Create Session */}
          <Card className="border-primary/20">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <UserPlus className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground">Start a Session</h3>
              </div>
              <Input
                placeholder="Where are you heading? (optional)"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="bg-muted/50"
              />
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Check-in every</span>
                <select
                  value={checkInInterval}
                  onChange={(e) => setCheckInInterval(Number(e.target.value))}
                  className="bg-muted border border-border rounded px-2 py-1 text-sm"
                >
                  <option value={5}>5 min</option>
                  <option value={10}>10 min</option>
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                </select>
              </div>
              <Button onClick={handleCreate} disabled={loading} className="w-full">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Users className="w-4 h-4 mr-2" />}
                Create Buddy Session
              </Button>
            </CardContent>
          </Card>

          {/* Join Session */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Navigation className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground">Join a Session</h3>
              </div>
              <Input
                placeholder="Enter session code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="bg-muted/50 uppercase tracking-widest text-center font-mono text-lg"
              />
              <Button onClick={handleJoin} disabled={loading || joinCode.length < 4} className="w-full" variant="outline">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                Join as Buddy
              </Button>
            </CardContent>
          </Card>

          {/* How it works */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">How it works:</p>
            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="shrink-0 mt-0.5">1</Badge>
              <span>Create a session and share the code with your trusted person</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="shrink-0 mt-0.5">2</Badge>
              <span>Both of you share live location and can chat in real-time</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="shrink-0 mt-0.5">3</Badge>
              <span>Check in on time — if you miss a check-in, your buddy gets alerted</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ——— SESSION VIEW ———
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
        <Button variant="ghost" size="icon" onClick={handleEnd}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="font-bold text-foreground text-sm">
              {session?.status === "waiting" ? "Waiting for buddy..." : `With ${partnerName || "Buddy"}`}
            </span>
          </div>
          {session?.destination && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" /> {session.destination}
            </p>
          )}
        </div>
        <Badge variant={session?.status === "active" ? "default" : "secondary"}>
          {session?.status === "active" ? "Active" : "Waiting"}
        </Badge>
      </div>

      {/* Session code banner (if waiting) */}
      {session?.status === "waiting" && (
        <div className="bg-primary/5 border-b border-border px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Share this code with your buddy:</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-mono font-bold tracking-[0.3em] text-primary">
              {session.session_code}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Check-in timer + location bar */}
      {session?.status === "active" && (
        <div className="bg-card border-b border-border px-4 py-2 flex items-center gap-3 shrink-0">
          {checkInCountdown !== null && (
            <div className="flex items-center gap-1.5">
              <Clock className={`w-4 h-4 ${checkInCountdown < 60 ? "text-red-400 animate-pulse" : "text-muted-foreground"}`} />
              <span className={`text-sm font-mono ${checkInCountdown < 60 ? "text-red-400 font-bold" : "text-muted-foreground"}`}>
                {formatCountdown(checkInCountdown)}
              </span>
            </div>
          )}
          <Button size="sm" className="ml-auto" variant="outline" onClick={handleCheckIn}>
            <Check className="w-3.5 h-3.5 mr-1" /> Check In
          </Button>
          <Button size="sm" variant="destructive" onClick={handleAlert}>
            <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Alert
          </Button>
        </div>
      )}

      {/* Partner location info */}
      {session?.status === "active" && partnerLat && partnerLng && (
        <div className="bg-muted/30 border-b border-border px-4 py-2 flex items-center gap-2 text-xs text-muted-foreground shrink-0">
          <Navigation className="w-3.5 h-3.5 text-primary" />
          <span>
            {partnerName}'s location: {partnerLat.toFixed(4)}, {partnerLng.toFixed(4)}
          </span>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3">
        <div className="space-y-2 max-w-md mx-auto">
          {messages.length === 0 && session?.status === "active" && (
            <p className="text-center text-sm text-muted-foreground py-8">
              <MessageCircle className="w-6 h-6 mx-auto mb-2 opacity-40" />
              Start chatting with your buddy!
            </p>
          )}
          {session?.status === "waiting" && messages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin opacity-40" />
              Waiting for your buddy to join...
            </p>
          )}
          {messages.map((msg) => {
            const isOwn = msg.sender_id === user?.id;
            const isSystem = msg.message_type === "check_in" || msg.message_type === "alert";

            if (isSystem) {
              return (
                <div
                  key={msg.id}
                  className={`text-center text-xs py-1.5 px-3 rounded-full mx-auto w-fit ${
                    msg.message_type === "alert"
                      ? "bg-destructive/10 text-destructive font-semibold"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {msg.message}
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
                    isOwn
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}
                >
                  {!isOwn && <p className="text-[10px] font-semibold opacity-70 mb-0.5">{msg.sender_name}</p>}
                  <p className="text-sm">{msg.message}</p>
                  <p className="text-[10px] opacity-50 mt-0.5 text-right">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Message input */}
      {session?.status === "active" && (
        <div className="bg-card border-t border-border px-4 py-3 shrink-0">
          <form
            className="flex gap-2 max-w-md mx-auto"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <Input
              placeholder="Type a message..."
              value={msgInput}
              onChange={(e) => setMsgInput(e.target.value)}
              className="flex-1 bg-muted/50"
            />
            <Button type="submit" size="icon" disabled={!msgInput.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      )}

      {/* End session button */}
      <div className="bg-card border-t border-border px-4 py-2 shrink-0">
        <Button variant="destructive" size="sm" className="w-full max-w-md mx-auto block" onClick={handleEnd}>
          End Session
        </Button>
      </div>
    </div>
  );
}
