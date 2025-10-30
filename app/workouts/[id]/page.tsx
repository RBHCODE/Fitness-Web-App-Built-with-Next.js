"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExerciseSelector } from "@/components/exercise-selector";
import { supabase, Workout, WorkoutExercise, Exercise } from "@/lib/supabase";
import { ArrowLeft, Plus, Trash2, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";

export default function WorkoutDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workoutId = params.id as string;

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [workoutExercises, setWorkoutExercises] = useState<(WorkoutExercise & { exercise: Exercise })[]>([]);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkoutData();
  }, [workoutId]);

  const loadWorkoutData = async () => {
    setLoading(true);
    try {
      const { data: workoutData, error: workoutError } = await supabase
        .from("workouts")
        .select("*")
        .eq("id", workoutId)
        .maybeSingle();

      if (workoutError) throw workoutError;
      setWorkout(workoutData);

      const { data: exercisesData, error: exercisesError } = await supabase
        .from("workout_exercises")
        .select("*, exercise:exercises(*)")
        .eq("workout_id", workoutId)
        .order("order_index");

      if (exercisesError) throw exercisesError;
      setWorkoutExercises(exercisesData as any);
    } catch (error) {
      console.error("Error loading workout:", error);
      toast.error("Failed to load workout");
    } finally {
      setLoading(false);
    }
  };

  const handleAddExercise = async (exercise: Exercise, details: { sets: number; reps: number; weight: number }) => {
    try {
      const { error } = await supabase
        .from("workout_exercises")
        .insert([{
          workout_id: workoutId,
          exercise_id: exercise.id,
          sets: details.sets,
          reps: details.reps,
          weight: details.weight,
          order_index: workoutExercises.length,
        }]);

      if (error) throw error;

      toast.success("Exercise added!");
      loadWorkoutData();
    } catch (error) {
      console.error("Error adding exercise:", error);
      toast.error("Failed to add exercise");
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    try {
      const { error } = await supabase
        .from("workout_exercises")
        .delete()
        .eq("id", exerciseId);

      if (error) throw error;

      toast.success("Exercise removed");
      loadWorkoutData();
    } catch (error) {
      console.error("Error deleting exercise:", error);
      toast.error("Failed to remove exercise");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading workout...</p>
        </div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Workout not found</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.push("/")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{workout.name}</h1>
          <div className="flex flex-wrap gap-4 text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              {formatDate(workout.date)}
            </div>
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              {workout.duration_minutes} minutes
            </div>
          </div>
          {workout.notes && (
            <p className="mt-4 text-muted-foreground">{workout.notes}</p>
          )}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Exercises</CardTitle>
            <Button onClick={() => setShowExerciseSelector(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Exercise
            </Button>
          </CardHeader>
          <CardContent>
            {workoutExercises.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No exercises added yet</p>
                <p className="text-sm mt-2">Click "Add Exercise" to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {workoutExercises.map((we, index) => (
                  <div key={we.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          {index + 1}.
                        </span>
                        <h3 className="font-semibold">{we.exercise.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {we.exercise.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Badge variant="secondary">
                          {we.sets} sets
                        </Badge>
                        <Badge variant="secondary">
                          {we.reps} reps
                        </Badge>
                        {we.weight > 0 && (
                          <Badge variant="secondary">
                            {we.weight} lbs
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {we.exercise.muscle_groups.map((mg) => (
                          <Badge key={mg} variant="outline" className="text-xs">
                            {mg}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteExercise(we.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ExerciseSelector
        open={showExerciseSelector}
        onOpenChange={setShowExerciseSelector}
        onSelectExercise={handleAddExercise}
      />
    </div>
  );
}
