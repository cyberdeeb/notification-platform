export interface RouterPayload {
  provider: string;
  event: string;
  userId: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
}
