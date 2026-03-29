export type Priority = 'High' | 'Medium' | 'Low';
export type Category = 'Assignment' | 'Exam' | 'Practical';

export interface Task {
  _id?: string;
  TaskTitle: string;
  Category: Category;
  DueDate: string; // ISO string
  Priority: Priority;
  Status: boolean; // false = Pending, true = Completed
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface Schedule {
  _id?: string;
  Subject: string;
  Day: DayOfWeek;
  StartTime: string; // HH:mm
  EndTime: string; // HH:mm
  Venue: string;
}
