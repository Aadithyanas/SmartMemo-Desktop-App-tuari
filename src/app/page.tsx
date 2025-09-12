"use client"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mic, Play, Clock, Tag, TrendingUp, AudioWaveform } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { invoke } from "@tauri-apps/api/core"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { jwtDecode } from "jwt-decode"

// UPDATED: This interface now matches the backend API response
interface Memo {
  id: string;
  title: string;
  created_at: string;
  duration: string; // Duration is a "MM:SS" string
  transcription: string | null;
  tags: string[] | null; // Tags can be null
  audio_blob: number[];
}

// NEW: Interface for the decoded JWT payload, now including username
interface DecodedToken {
  email: string;
  sub: string;
  exp: number;
  username?: string; // Username is optional for backward compatibility
}

// Helper to parse "MM:SS" duration string to seconds
const parseDuration = (durationStr: string): number => {
    const parts = durationStr.split(':').map(Number);
    if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    }
    return 0;
};

function AnimatedCounter({ value, duration = 2 }: { value: number; duration?: number }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, Math.round)

  useEffect(() => {
    const animation = animate(count, value, { duration })
    return animation.stop
  }, [count, value, duration])

  return <motion.span>{rounded}</motion.span>
}

// NEW: Function to get a greeting based on the time of day
const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
};

export default function Dashboard() {
  const [memos, setMemos] = useState<Memo[]>([])
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string>(""); // NEW: State for username

  useEffect(() => {
    const storedToken = localStorage.getItem("jwt");
    if (storedToken) {
      setToken(storedToken);
      try {
        const decoded = jwtDecode<DecodedToken>(storedToken);
        // UPDATED: Prioritize username from token, fallback to email
        const name = decoded.username || decoded.email.split('@')[0];
        // Capitalize the first letter of the username
        const capitalizedUsername = name.charAt(0).toUpperCase() + name.slice(1);
        setUsername(capitalizedUsername);
      } catch (error) {
        console.error("Failed to decode token for username:", error);
        setUsername("User"); // Fallback username
      }
    } else {
      setLoading(false);
      toast.error("You must be logged in to view the dashboard.");
    }
  }, []);

  useEffect(() => {
    const fetchMemos = async () => {
      if (!token) return;
      
      setLoading(true);
      try {
        const memosData = await invoke<Memo[]>("get_memos_command", { token });
        setMemos(memosData)
      } catch (error) {
        console.error("Failed to fetch memos:", error)
        toast.error("Failed to load dashboard data.")
      } finally {
        setLoading(false)
      }
    }
    fetchMemos()
  }, [token])

  const recentMemos = memos.slice(0, 3)
  const totalMemos = memos.length
  const totalDurationInSeconds = memos.reduce((acc, memo) => acc + parseDuration(memo.duration), 0)

  const thisWeekMemos = memos.filter((memo) => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return new Date(memo.created_at) > weekAgo
  }).length

  if (loading) {
    return (
      <SidebarInset className="flex flex-col h-full">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center gap-2">
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </div>
        </header>
        <div className="p-6">Loading dashboard data...</div>
      </SidebarInset>
    )
  }
  
  if (!token) {
    return (
        <SidebarInset className="flex flex-col h-full">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <h1 className="text-lg font-semibold">Dashboard</h1>
            </header>
            <div className="flex items-center justify-center h-full p-6 text-center">
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle>Authentication Required</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">Please log in to view your dashboard.</p>
                        <Link href="/auth">
                            <Button>Go to Login</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </SidebarInset>
    )
  }

  return (
    <>
      <style jsx>{`
        /* All your keyframes and animation styles remain the same */
        @keyframes snake-border-1 { 0% { background-position: 0% 0%; } 25% { background-position: 100% 0%; } 50% { background-position: 100% 100%; } 75% { background-position: 0% 100%; } 100% { background-position: 0% 0%; } }
        .animated-border-1 { position: relative; background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4); background-size: 400% 400%; animation: snake-border-1 4s ease-in-out infinite; padding: 2px; border-radius: 12px; }
        .card-inner { background: hsl(var(--card)); border-radius: 10px; height: 100%; width: 100%; }
        /* ... other animation styles ... */
        .memo-border-1 { position: relative; border: 2px solid transparent; border-radius: 12px; background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4) border-box; background-size: 400% 400%; animation: snake-border-1 4s ease-in-out infinite; -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0); mask-composite: exclude; }
      `}</style>

      <SidebarInset className="flex flex-col h-full">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          {/* UPDATED: Personalized greeting */}
          <div className="flex flex-1 items-center gap-2">
            <h1 className="text-lg font-semibold">{getGreeting()}, {username}</h1>
          </div>
        </header>
        <motion.div
          className="flex-1 space-y-6 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Quick Stats */}
          <motion.div
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
          >
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="animated-border-1">
                <Card className="card-inner border-0">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Memos</CardTitle>
                    <AudioWaveform className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold"><AnimatedCounter value={totalMemos} /></div>
                    <p className="text-xs text-muted-foreground">All time recordings</p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="animated-border-2">
                    <Card className="card-inner border-0">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">This Week</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold"><AnimatedCounter value={thisWeekMemos} /></div>
                            <p className="text-xs text-muted-foreground">New memos recorded</p>
                        </CardContent>
                    </Card>
                </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="animated-border-3">
                    <Card className="card-inner border-0">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                <AnimatedCounter value={Math.round(totalDurationInSeconds / 60)} />m
                            </div>
                            <p className="text-xs text-muted-foreground">Minutes recorded</p>
                        </CardContent>
                    </Card>
                </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="animated-border-4">
                    <Card className="card-inner border-0">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Quick Record</CardTitle>
                            <Mic className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <Link href="/record">
                                <Button className="w-full"><Mic className="mr-2 h-4 w-4" /> Start Recording</Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </motion.div>
          </motion.div>

          {/* Recent Memos */}
          <div className="animated-border-5">
            <Card className="card-inner border-0">
              <CardHeader>
                <CardTitle>Recent Memos</CardTitle>
                <CardDescription>Your latest voice recordings and transcriptions</CardDescription>
              </CardHeader>
              <CardContent>
                {recentMemos.length === 0 ? (
                  <div className="text-center py-8">
                    <AudioWaveform className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No memos yet</h3>
                    <p className="text-muted-foreground mb-4">Start by recording your first voice memo</p>
                    <Link href="/record"><Button><Mic className="mr-2 h-4 w-4" /> Record Now</Button></Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentMemos.map((memo, index) => (
                      <motion.div
                        key={memo.id}
                        className={`memo-border-${(index % 4) + 1}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                      >
                        <div className="flex items-start space-x-4 p-4 bg-gray-800 rounded-lg">
                          <Button variant="outline" size="icon"><Play className="h-4 w-4" /></Button>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium truncate">{memo.title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {memo.transcription || "No transcription available"}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                {memo.duration}
                              </Badge>
                              {(memo.tags || []).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  <Tag className="w-3 h-3 mr-1" />{tag}
                                </Badge>
                              ))}
                              <span className="text-xs text-muted-foreground ml-auto">
                                {formatDistanceToNow(new Date(memo.created_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    <div className="text-center pt-4">
                      <Link href="/memos"><Button variant="outline">View All Memos</Button></Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </SidebarInset>
    </>
  )
}
