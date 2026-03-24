export type Role = "startup" | "student" | "ecosystem";

export type SignupFormData = {
  role: Role;
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  password: string;
  phone: string;
  skills: string[];
  intent: string;

  // UI-only extra fields for your product flow
  startupName: string;
  cin: string;
  managerRoleType: string;
  registrationNumber: string;
  timezone: string;
  timeCommitment: string;
};