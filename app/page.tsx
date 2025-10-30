"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StatsCard } from "@/components/stats-card";
import { WorkoutCard } from "@/components/workout-card";
import { NewWorkoutDialog } from "@/components/new-workout-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase, Workout } from "@/lib/supabase";
import { Activity, Calendar, Dumbbell, TrendingUp, BarChart3, LineChart } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    thisWeekWorkouts: 0,
    totalMinutes: 0,
    avgDuration: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const { data: workoutsData, error: workoutsError } = await supabase
        .from("workouts")
        .select("*")
        .order("date", { ascending: false })
        .limit(6);

      if (workoutsError) throw workoutsError;

      setWorkouts(workoutsData || []);

      const { data: allWorkouts, error: statsError } = await supabase
        .from("workouts")
        .select("duration_minutes, date");

      if (statsError) throw statsError;

      const totalWorkouts = allWorkouts?.length || 0;
      const totalMinutes = allWorkouts?.reduce((sum, w) => sum + w.duration_minutes, 0) || 0;
      const avgDuration = totalWorkouts > 0 ? Math.round(totalMinutes / totalWorkouts) : 0;

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const thisWeekWorkouts = allWorkouts?.filter(w => new Date(w.date) >= oneWeekAgo).length || 0;

      setStats({
        totalWorkouts,
        thisWeekWorkouts,
        totalMinutes,
        avgDuration,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getExerciseCount = async (workoutId: string) => {
    const { data } = await supabase
      .from("workout_exercises")
      .select("id")
      .eq("workout_id", workoutId);

    return data?.length || 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Dumbbell className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">FitTrack</h1>
                <p className="text-sm text-gray-500">Your Fitness Journey</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => router.push("/progress")}>
                <LineChart className="mr-2 h-4 w-4" />
                Progress
              </Button>
              <NewWorkoutDialog onWorkoutCreated={loadDashboardData} />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="exercises">Exercises</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Total Workouts"
                value={stats.totalWorkouts}
                icon={Activity}
                description="All time"
              />
              <StatsCard
                title="This Week"
                value={stats.thisWeekWorkouts}
                icon={Calendar}
                description="Last 7 days"
              />
              <StatsCard
                title="Total Time"
                value={`${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m`}
                icon={TrendingUp}
                description="Training time"
              />
              <StatsCard
                title="Avg Duration"
                value={`${stats.avgDuration}min`}
                icon={BarChart3}
                description="Per workout"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Workouts</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Loading workouts...
                  </div>
                ) : workouts.length === 0 ? (
                  <div className="text-center py-12">
                    <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No workouts yet</p>
                    <NewWorkoutDialog onWorkoutCreated={loadDashboardData} />
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {workouts.map((workout) => (
                      <WorkoutCard
                        key={workout.id}
                        name={workout.name}
                        date={workout.date}
                        duration={workout.duration_minutes}
                        exerciseCount={0}
                        onClick={() => router.push(`/workouts/${workout.id}`)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exercises" className="space-y-6">
            <ExerciseLibrary />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function ExerciseLibrary() {
  const [exercises, setExercises] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    setLoading(true);
    try {
      const { data: categoriesData } = await supabase
        .from("exercise_categories")
        .select("*")
        .order("name");

      const { data: exercisesData } = await supabase
        .from("exercises")
        .select("*, category:exercise_categories(name)")
        .order("name");

      setCategories(categoriesData || []);
      setExercises(exercisesData || []);
    } catch (error) {
      console.error("Error loading exercises:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredExercises = selectedCategory
    ? exercises.filter(ex => ex.category_id === selectedCategory)
    : exercises;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Exercise Library</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              onClick={() => setSelectedCategory(null)}
              size="sm"
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                size="sm"
              >
                {category.name}
              </Button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading exercises...
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredExercises.map((exercise) => (
                <Card key={exercise.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{exercise.name}</CardTitle>
                      <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(exercise.difficulty)}`}>
                        {exercise.difficulty}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      {exercise.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {exercise.muscle_groups.map((mg: string) => (
                        <span
                          key={mg}
                          className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded"
                        >
                          {mg}
                        </span>
                      ))}
                    </div>
                    {exercise.instructions && (
                      <details className="mt-3">
                        <summary className="text-sm font-medium cursor-pointer text-blue-600 hover:text-blue-800">
                          View Instructions
                        </summary>
                        <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">
                          {exercise.instructions}
                        </p>
                      </details>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
