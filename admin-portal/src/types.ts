export interface Product {
  id: string;          // e.g. 'ACE-101'
  code: string;        // e.g. 'ace101'
  name: string;        // e.g. 'Flow & Level Control Trainer'
  category: string;    // 'Process Control Trainers', 'Process Simulators', etc.
  version?: string;
  description?: string;
}

export interface College {
  id: string;
  college_name: string;
  department: string;
  contact_person: string;
  phone: string;
  email: string;
  password_hash: string;
  max_activations: number;
  active_activations: number;
  status: 'active' | 'suspended' | 'expired';
  notes?: string;
  created_at?: string;
  products: string[]; // array of product codes, e.g. ['ace101', 'sim-ace401']
}

export interface ActivationLog {
  id: string;
  college_email: string;
  machine_id: string;
  machine_name: string;
  ip_address: string;
  modules_activated: string[];
  install_type: 'online' | 'offline';
  activated_at: string;
}
