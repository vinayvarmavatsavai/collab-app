export type User = {
  username: string;
  fullName: string;
  role: string;
  email: string;
};

export const mockUsers: User[] = [
  { username: "vinay", fullName: "Vinay Sharma", role: "Student", email: "vinay@example.com" },
  { username: "saanvi", fullName: "Saanvi Mehta", role: "Founder", email: "saanvi@example.com" },
  { username: "rahul", fullName: "Rahul Verma", role: "Engineer", email: "rahul@example.com" },
  { username: "nora", fullName: "Nora James", role: "Designer", email: "nora@example.com" },
  { username: "arjun", fullName: "Arjun Nair", role: "ML Engineer", email: "arjun@example.com" },
  { username: "meera", fullName: "Meera Iyer", role: "Product Manager", email: "meera@example.com" },
  { username: "karthik", fullName: "Karthik Rao", role: "Researcher", email: "karthik@example.com" },
];
