export interface Application {
  id: string;
  discord_username: string;
  department: string;
  answers: string[];
  status: 'pending' | 'under_review' | 'interview_scheduled' | 'approved' | 'rejected';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  tags: string[];
  
  // Applicant information
  applicant_email?: string;
  applicant_age?: number;
  previous_experience?: string;
  timezone?: string;
  availability?: string;
  
  // Review information
  reviewed_by?: string;
  reviewed_at?: string;
  notes?: string;
  
  // Interview information
  interview_scheduled: boolean;
  interview_date?: string;
  interview_notes?: string;
  
  // Final decision
  final_decision_reason?: string;
  
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  username: string;
  email?: string;
  role: 'admin' | 'super_admin' | 'department_head';
  department?: string;
  permissions: Record<string, boolean>;
  preferences: Record<string, any>;
  is_active: boolean;
  last_login?: string;
  login_count: number;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ApplicationComment {
  id: string;
  application_id: string;
  admin_id: string;
  comment: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
  admin?: AdminUser;
}

export interface ApplicationAttachment {
  id: string;
  application_id: string;
  filename: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user?: AdminUser;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

export interface ApplicationTemplate {
  id: string;
  name: string;
  department: string;
  description?: string;
  questions: string[];
  requirements: Record<string, any>;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  ip_address?: string;
  user_agent?: string;
  expires_at: string;
  created_at: string;
  last_accessed: string;
}

export interface ApplicationStats {
  total: number;
  pending: number;
  under_review: number;
  interview_scheduled: number;
  approved: number;
  rejected: number;
  high_priority: number;
  urgent_priority: number;
  interviews_scheduled: number;
  today_applications: number;
  this_week_applications: number;
  this_month_applications: number;
}

export interface BulkAction {
  action: 'approve' | 'reject' | 'set_priority' | 'add_tag' | 'remove_tag' | 'set_status' | 'schedule_interview';
  applicationIds: string[];
  value?: string;
  reason?: string;
}

export interface SystemSettings {
  id: string;
  setting_key: string;
  setting_value: any;
  description?: string;
  updated_by?: string;
  updated_at: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApplicationReport {
  id: string;
  name: string;
  description?: string;
  filters: Record<string, any>;
  columns: string[];
  created_by?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  fullName: string;
  description: string;
  motto: string;
  isOpen: boolean;
  requirements: {
    minAge: number;
    discordRequired: boolean;
    micRequired?: boolean;
    backgroundCheck?: boolean;
    trainingRequired?: boolean;
    experiencePreferred?: boolean;
  };
}

export const DEPARTMENTS: Department[] = [
  {
    id: 'staff',
    name: 'Staff',
    fullName: 'Orlando City Roleplay Staff',
    description: 'Join our dedicated staff team and help shape the Orlando City Roleplay experience. Staff members are responsible for maintaining server quality, assisting players, and ensuring everyone has an enjoyable roleplay experience.',
    motto: 'Dedication, Integrity, Community',
    isOpen: true,
    requirements: {
      minAge: 13,
      discordRequired: true,
      experiencePreferred: false
    }
  },
  {
    id: 'ocso',
    name: 'OCSO',
    fullName: 'Orange County Sheriff\'s Office',
    description: 'The Orange County Sheriff\'s Office (OCSO) is a law enforcement agency serving Orange County, Florida. Committed to public safety and community engagement, the OCSO provides a wide range of services including patrol, criminal investigations, emergency response, and crime prevention.',
    motto: 'Trust, Transparency, Dignity & Respect',
    isOpen: true,
    requirements: {
      minAge: 13,
      discordRequired: true,
      micRequired: true,
      backgroundCheck: true
    }
  },
  {
    id: 'ocpd',
    name: 'OCPD',
    fullName: 'Orlando City Police Department',
    description: 'The Orlando City Police Department (OCPD) is a dedicated and professional law enforcement agency within Orlando City Roleplay. Focused on protecting the community and upholding the law, OCPD officers are trained to handle a wide range of situations with integrity, respect, and realism.',
    motto: 'Courage, Pride, Commitment',
    isOpen: true,
    requirements: {
      minAge: 13,
      discordRequired: true,
      micRequired: true,
      trainingRequired: true
    }
  },
  {
    id: 'ocfrd',
    name: 'OCFRD',
    fullName: 'Orlando City Fire & Rescue Department',
    description: 'The Orlando City Fire & Rescue Department (OCFRD) is a highly trained and responsive emergency services team within Orlando City Roleplay. Committed to saving lives and protecting property, OCFRD handles fire suppression, medical emergencies, and rescue operations with professionalism and efficiency.',
    motto: 'We Rise to Save',
    isOpen: true,
    requirements: {
      minAge: 13,
      discordRequired: true,
      micRequired: true,
      experiencePreferred: true
    }
  },
  {
    id: 'fhp',
    name: 'FHP',
    fullName: 'Florida Highway Patrol',
    description: 'The Florida Highway Patrol (FHP) is a specialized state law enforcement agency within Orlando City Roleplay, focused on ensuring safety and enforcing traffic laws on highways and major roadways. Known for their professionalism and high standards, FHP troopers handle pursuits, traffic enforcement, accident response, and DUI patrols.',
    motto: 'Courtesy, Service, and Protection',
    isOpen: true,
    requirements: {
      minAge: 13,
      discordRequired: true,
      micRequired: true,
      backgroundCheck: true
    }
  },
  {
    id: 'fwc',
    name: 'FWC',
    fullName: 'Florida Fish and Wildlife Conservation Commission',
    description: 'The Florida Fish and Wildlife Conservation Commission (FWC) in Orlando City Roleplay is a specialized agency dedicated to protecting the state\'s natural resources and wildlife. Officers with the FWC patrol rural areas, waterways, and parks, enforcing laws related to hunting, fishing, boating, and environmental conservation.',
    motto: 'Patrol, Protect, Preserve',
    isOpen: true,
    requirements: {
      minAge: 13,
      discordRequired: true,
      experiencePreferred: true
    }
  },
  {
    id: 'civilian',
    name: 'Civilian Ops',
    fullName: 'Orlando City Civilian Operations',
    description: 'Orlando City Civilian Operations focuses on creating realistic civilian roleplay experiences. From business owners to everyday citizens, civilian operations provide the backbone of our roleplay community, creating immersive scenarios and interactions that make the city feel alive.',
    motto: 'Building Community, Creating Stories',
    isOpen: true,
    requirements: {
      minAge: 13,
      discordRequired: true
    }
  },
  {
    id: 'fdot',
    name: 'FDOT',
    fullName: 'Florida Department of Transportation',
    description: 'The Florida Department of Transportation (FDOT) is responsible for maintaining and improving the state\'s transportation infrastructure. In Orlando City Roleplay, FDOT personnel handle road construction, maintenance, traffic management, and emergency road repairs to keep the city moving safely and efficiently.',
    motto: 'Moving Florida Forward',
    isOpen: true,
    requirements: {
      minAge: 13,
      discordRequired: true,
      experiencePreferred: true
    }
  }
];