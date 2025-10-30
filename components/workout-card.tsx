"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Dumbbell } from "lucide-react";

interface WorkoutCardProps {
  name: string;
  date: string;
  duration: number;
  exerciseCount: number;
  onClick?: () => void;
}

export function WorkoutCard({ name, date, duration, exerciseCount, onClick }: WorkoutCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="mr-2 h-4 w-4" />
            {formatDate(date)}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="mr-2 h-4 w-4" />
            {duration} minutes
          </div>
          <div className="flex items-center justify-between mt-4">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Dumbbell className="h-3 w-3" />
              {exerciseCount} exercises
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
