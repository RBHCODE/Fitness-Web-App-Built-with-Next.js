"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase, Exercise } from "@/lib/supabase";
import { Search } from "lucide-react";

interface ExerciseSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectExercise: (exercise: Exercise, details: { sets: number; reps: number; weight: number }) => void;
}

export function ExerciseSelector({ open, onOpenChange, onSelectExercise }: ExerciseSelectorProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [details, setDetails] = useState({ sets: 3, reps: 10, weight: 0 });

  useEffect(() => {
    if (open) {
      loadExercises();
    }
  }, [open]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = exercises.filter(ex =>
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.muscle_groups.some(mg => mg.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredExercises(filtered);
    } else {
      setFilteredExercises(exercises);
    }
  }, [searchQuery, exercises]);

  const loadExercises = async () => {
    const { data, error } = await supabase
      .from("exercises")
      .select("*")
      .order("name");

    if (data && !error) {
      setExercises(data);
      setFilteredExercises(data);
    }
  };

  const handleAddExercise = () => {
    if (selectedExercise) {
      onSelectExercise(selectedExercise, details);
      setSelectedExercise(null);
      setDetails({ sets: 3, reps: 10, weight: 0 });
      onOpenChange(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add Exercise</DialogTitle>
          <DialogDescription>
            Select an exercise and specify the details
          </DialogDescription>
        </DialogHeader>

        {!selectedExercise ? (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search exercises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {filteredExercises.map((exercise) => (
                  <div
                    key={exercise.id}
                    className="p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => setSelectedExercise(exercise)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{exercise.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {exercise.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {exercise.muscle_groups.map((mg) => (
                            <Badge key={mg} variant="outline" className="text-xs">
                              {mg}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Badge className={getDifficultyColor(exercise.difficulty)}>
                        {exercise.difficulty}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-accent rounded-lg">
              <h3 className="font-semibold text-lg">{selectedExercise.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedExercise.description}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sets">Sets</Label>
                <Input
                  id="sets"
                  type="number"
                  min="1"
                  value={details.sets}
                  onChange={(e) => setDetails({ ...details, sets: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reps">Reps</Label>
                <Input
                  id="reps"
                  type="number"
                  min="1"
                  value={details.reps}
                  onChange={(e) => setDetails({ ...details, reps: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (lbs)</Label>
                <Input
                  id="weight"
                  type="number"
                  min="0"
                  step="5"
                  value={details.weight}
                  onChange={(e) => setDetails({ ...details, weight: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSelectedExercise(null)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleAddExercise} className="flex-1">
                Add Exercise
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
