"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase, ProgressMetric } from "@/lib/supabase";
import { ArrowLeft, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function ProgressPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<ProgressMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: "",
    body_fat_percentage: "",
    notes: "",
  });

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("progress_metrics")
        .select("*")
        .order("date", { ascending: true });

      if (error) throw error;
      setMetrics(data || []);
    } catch (error) {
      console.error("Error loading metrics:", error);
      toast.error("Failed to load progress data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from("progress_metrics")
        .insert([{
          date: formData.date,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          body_fat_percentage: formData.body_fat_percentage ? parseFloat(formData.body_fat_percentage) : null,
          notes: formData.notes || null,
        }]);

      if (error) throw error;

      toast.success("Progress recorded!");
      setShowDialog(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        weight: "",
        body_fat_percentage: "",
        notes: "",
      });
      loadMetrics();
    } catch (error) {
      console.error("Error saving metric:", error);
      toast.error("Failed to save progress");
    }
  };

  const chartData = metrics.map(m => ({
    date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: m.weight || 0,
    bodyFat: m.body_fat_percentage || 0,
  }));

  const getLatestMetric = () => {
    if (metrics.length === 0) return null;
    return metrics[metrics.length - 1];
  };

  const getChange = (field: 'weight' | 'body_fat_percentage') => {
    if (metrics.length < 2) return null;
    const latest = metrics[metrics.length - 1];
    const previous = metrics[metrics.length - 2];
    const latestValue = latest[field];
    const previousValue = previous[field];

    if (!latestValue || !previousValue) return null;

    const change = latestValue - previousValue;
    const percentChange = ((change / previousValue) * 100).toFixed(1);

    return {
      value: change.toFixed(1),
      percent: percentChange,
      isPositive: change > 0,
    };
  };

  const latestMetric = getLatestMetric();
  const weightChange = getChange('weight');
  const bodyFatChange = getChange('body_fat_percentage');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => router.push("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Log Progress
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>Log Progress</DialogTitle>
                    <DialogDescription>
                      Record your body metrics and progress
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="weight">Weight (lbs)</Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.1"
                        placeholder="e.g., 180"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="body_fat">Body Fat %</Label>
                      <Input
                        id="body_fat"
                        type="number"
                        step="0.1"
                        placeholder="e.g., 15.5"
                        value={formData.body_fat_percentage}
                        onChange={(e) => setFormData({ ...formData, body_fat_percentage: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="notes">Notes (optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="How are you feeling?"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Save Progress</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Progress Tracking</h1>
          <p className="text-muted-foreground">Monitor your fitness journey over time</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Weight</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {latestMetric?.weight ? `${latestMetric.weight} lbs` : "No data"}
              </div>
              {weightChange && (
                <div className="flex items-center mt-2 text-sm">
                  {weightChange.isPositive ? (
                    <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
                  )}
                  <span className={weightChange.isPositive ? "text-red-500" : "text-green-500"}>
                    {weightChange.isPositive ? "+" : ""}{weightChange.value} lbs ({weightChange.percent}%)
                  </span>
                  <span className="text-muted-foreground ml-1">vs last entry</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Body Fat %</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {latestMetric?.body_fat_percentage ? `${latestMetric.body_fat_percentage}%` : "No data"}
              </div>
              {bodyFatChange && (
                <div className="flex items-center mt-2 text-sm">
                  {bodyFatChange.isPositive ? (
                    <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
                  )}
                  <span className={bodyFatChange.isPositive ? "text-red-500" : "text-green-500"}>
                    {bodyFatChange.isPositive ? "+" : ""}{bodyFatChange.value}% ({bodyFatChange.percent}%)
                  </span>
                  <span className="text-muted-foreground ml-1">vs last entry</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Loading progress data...
            </CardContent>
          </Card>
        ) : metrics.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No progress data yet</p>
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Log Your First Entry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Weight Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Weight (lbs)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Body Fat Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="bodyFat"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Body Fat %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Progress History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.slice().reverse().map((metric) => (
                    <div key={metric.id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">
                          {new Date(metric.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        {metric.weight && <span>Weight: {metric.weight} lbs</span>}
                        {metric.body_fat_percentage && <span>Body Fat: {metric.body_fat_percentage}%</span>}
                      </div>
                      {metric.notes && (
                        <p className="text-sm mt-2 text-muted-foreground">{metric.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
