"use client"

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, Variants } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { TrendingUp, Clock, FileText, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const pulseVariants: Variants = {
  initial: { scale: 1, opacity: 1 },
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.9, 1],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  },
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

interface Memo {
  id: string;
  title: string;
  created_at: string;
  duration: string;
  transcription: string | null;
  translate: string | null;
  summary: string | null;
  tags: string[] | null;
}

interface ChartDataItem {
  name: string;
  duration: number;
  date: string;
  fullName: string;
}

interface TagDataItem {
  name: string;
  value: number;
}

interface WeeklyDataItem {
  day: string;
  memos: number;
  duration: number;
}

const parseDuration = (durationStr: string): number => {
    const parts = durationStr.split(':').map(Number);
    return parts.length === 2 ? parts[0] * 60 + parts[1] : 0;
};

export const AnalyticsDashboard = () => {
  const [stats, setStats] = useState({
    totalMemos: 0,
    activeMemos: 0,
    completedMemos: 0,
    averageRecallTime: "0:00"
  });
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [tagData, setTagData] = useState<TagDataItem[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null); // NEW: State for JWT

  // NEW: Effect to load token from localStorage on component mount
  useEffect(() => {
    const storedToken = localStorage.getItem("jwt");
    if (storedToken) {
      setToken(storedToken);
    } else {
      setLoading(false); // If no token, stop loading
      toast.error("You must be logged in to view analytics.");
    }
  }, []);

  // NEW: Effect to fetch data only after the token is loaded
  useEffect(() => {
    const fetchData = async () => {
      if (!token) return; // Don't fetch if there's no token

      setLoading(true);
      try {
        const memos = await invoke<Memo[]>("get_memos_command", { token });
        
        const totalMemos = memos.length;
        const activeMemos = memos.filter(memo => 
          memo.tags?.includes('active') || memo.tags?.includes('pending')
        ).length;
        const completedMemos = memos.filter(memo => 
          memo.tags?.includes('completed') || memo.tags?.includes('done')
        ).length;
        
        const totalDurationInSeconds = memos.reduce((sum, memo) => sum + parseDuration(memo.duration), 0);
        const avgDuration = totalMemos > 0 ? Math.round(totalDurationInSeconds / totalMemos) : 0;
        const avgMinutes = Math.floor(avgDuration / 60);
        const avgSeconds = avgDuration % 60;
        const averageRecallTime = `${avgMinutes}:${avgSeconds.toString().padStart(2, '0')}`;

        setStats({ totalMemos, activeMemos, completedMemos, averageRecallTime });

        const durationData: ChartDataItem[] = memos.map((memo) => ({
          name: memo.title.length > 15 ? `${memo.title.substring(0, 15)}...` : memo.title,
          duration: Math.round(parseDuration(memo.duration) / 60),
          date: memo.created_at,
          fullName: memo.title
        }));
        setChartData(durationData);

        const tagCount = memos.reduce((acc, memo) => {
          (memo.tags || []).forEach(tag => {
            acc[tag] = (acc[tag] || 0) + 1;
          });
          return acc;
        }, {} as Record<string, number>);

        const tagChartData: TagDataItem[] = Object.entries(tagCount).map(([tag, count]) => ({
          name: tag.charAt(0).toUpperCase() + tag.slice(1),
          value: count
        }));
        setTagData(tagChartData);

        const weeklyMemoData = processWeeklyData(memos);
        setWeeklyData(weeklyMemoData);

      } catch (error) {
        console.error("Failed to fetch memos:", error);
        toast.error("Failed to load analytics data.");
        setStats({ totalMemos: 0, activeMemos: 0, completedMemos: 0, averageRecallTime: "0:00" });
        setChartData([]);
        setTagData([]);
        setWeeklyData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]); // This effect now depends on the token

  const processWeeklyData = (memos: Memo[]): WeeklyDataItem[] => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyStats: WeeklyDataItem[] = days.map(day => ({ day, memos: 0, duration: 0 }));
    
    memos.forEach(memo => {
      const memoDate = new Date(memo.created_at);
      const dayIndex = (memoDate.getDay() + 6) % 7;
      
      if (dayIndex >= 0 && dayIndex < 7) {
        weeklyStats[dayIndex].memos += 1;
        weeklyStats[dayIndex].duration += parseDuration(memo.duration);
      }
    });
    
    weeklyStats.forEach(stat => {
      stat.duration = Math.round(stat.duration / 60);
    });
    
    return weeklyStats;
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'];

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium bg-gray-200 dark:bg-gray-700 h-4 w-24 rounded"></CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold bg-gray-200 dark:bg-gray-700 h-8 w-12 rounded mt-1"></div>
                <div className="text-xs text-muted-foreground bg-gray-200 dark:bg-gray-700 h-3 w-32 rounded mt-2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="animate-pulse">
            <CardHeader>
              <CardTitle className="text-lg font-semibold bg-gray-200 dark:bg-gray-700 h-6 w-40 rounded"></CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] bg-gray-200 dark:bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
          <Card className="animate-pulse">
            <CardHeader>
              <CardTitle className="text-lg font-semibold bg-gray-200 dark:bg-gray-700 h-6 w-40 rounded"></CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] bg-gray-200 dark:bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  if (!token) {
    return (
        <div className="flex items-center justify-center h-full p-6 text-center">
            <Card className="max-w-md">
                <CardHeader>
                    <CardTitle>Authentication Required</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Please log in to view your analytics dashboard.</p>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <motion.div 
      className="space-y-6 p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div variants={cardVariants}>
          <motion.div
            variants={pulseVariants}
            initial="initial"
            animate="pulse"
          >
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 dark:border-blue-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-200">Total Memos</CardTitle>
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.totalMemos}</div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  Total recorded memos
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:from-green-900/50 dark:to-green-800/50 dark:border-green-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-200">Active Memos</CardTitle>
              <Clock className="h-4 w-4 text-green-600 dark:text-green-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.activeMemos}</div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Currently in progress
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 dark:from-purple-900/50 dark:to-purple-800/50 dark:border-purple-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-200">Completed Memos</CardTitle>
              <CheckCircle className="h-4 w-4 text-purple-600 dark:text-purple-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.completedMemos}</div>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                Successfully processed
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 dark:from-orange-900/50 dark:to-orange-800/50 dark:border-orange-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-200">Avg. Recall Time</CardTitle>
              <Clock className="h-4 w-4 text-orange-600 dark:text-orange-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.averageRecallTime}</div>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                Average duration
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Weekly Activity Chart */}
        <motion.div variants={cardVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Weekly Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {weeklyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={weeklyData}>
                    <defs>
                      <linearGradient id="colorMemos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Area type="monotone" dataKey="memos" stroke="#3B82F6" fillOpacity={1} fill="url(#colorMemos)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Tag Distribution Pie Chart */}
        <motion.div variants={cardVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Tag Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {tagData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={tagData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    >
                      {tagData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No tags available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Duration Analysis */}
      <motion.div variants={cardVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Memo Duration Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} label={{ value: 'Duration (minutes)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number, name: string, props) => [`${value} minutes`, 'Duration']}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                  />
                  <Bar dataKey="duration" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                No memos available
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};
