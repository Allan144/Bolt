export type UserRole = 'admin' | 'teacher' | 'parent' | 'student';

export interface AppUser {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface ClientInfo {
  id: string;
  user_id: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  emergency_contact: string;
  notes: string;
  created_at: string;
  updated_at: string;
  user?: AppUser;
}

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export interface Student {
  id: string;
  client_id: string;
  first_name: string;
  last_name: string;
  age: number | null;
  skill_level: SkillLevel;
  lesson_rate: number;
  notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  client?: ClientInfo;
}

export type LessonType = 'private' | 'group' | 'recital' | 'makeup' | 'trial';
export type EventStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';

export interface CalendarEvent {
  id: string;
  title: string;
  student_id: string | null;
  teacher_id: string | null;
  start_time: string;
  end_time: string;
  recurrence_rule: string;
  lesson_type: LessonType;
  status: EventStatus;
  color: string;
  notes: string;
  created_at: string;
  updated_at: string;
  student?: Student;
}

export type BillingStatus = 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
export type PaymentMethod = '' | 'cash' | 'check' | 'stripe' | 'stripe_terminal' | 'venmo' | 'zelle' | 'other';

export interface BillingRecord {
  id: string;
  student_id: string | null;
  client_id: string | null;
  amount: number;
  description: string;
  due_date: string | null;
  paid_date: string | null;
  status: BillingStatus;
  payment_method: PaymentMethod;
  stripe_payment_intent_id: string;
  invoice_number: string;
  notes: string;
  created_at: string;
  updated_at: string;
  student?: Student;
  client?: ClientInfo;
}

export interface LessonHistory {
  id: string;
  event_id: string | null;
  student_id: string;
  teacher_id: string | null;
  lesson_date: string;
  duration_minutes: number;
  topics_covered: string;
  homework: string;
  notes: string;
  rating: number | null;
  created_at: string;
  student?: Student;
}

export type Priority = 'low' | 'medium' | 'high';

export interface TicklerItem {
  id: string;
  user_id: string;
  title: string;
  description: string;
  due_date: string | null;
  priority: Priority;
  is_completed: boolean;
  related_student_id: string | null;
  created_at: string;
  updated_at: string;
  student?: Student;
}

export interface ChatAnswer {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}
