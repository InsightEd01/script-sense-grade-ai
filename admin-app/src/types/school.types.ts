export interface School {
  id: string;
  name: string;
  address?: string;
  maxTeachers?: number;
  maxStudents?: number;
  primaryColor?: string;
  secondaryColor?: string;
  studentCount?: number;
  teacherCount?: number;
  storageUsed?: string;
  status?: 'active' | 'inactive';
  created_at: string;
  created_by: string;
  updated_at?: string;
}

export interface CreateSchoolRequest {
  name: string;
  address: string;
  maxTeachers?: number;
  maxStudents?: number;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface UpdateSchoolRequest extends CreateSchoolRequest {
  id: string;
}
