export interface Port {
  number: number;
  inUse: boolean;
  user: string;
  department: string;
  connectionType: string;
  vlan: string;
  notes: string;
}

export interface Panel {
  id: string;
  name: string;
  totalPorts: number;
  used: number;
  available: number;
  ports: Port[];
}

export interface Terminal {
  name: string;
  location: string;
  panels: Panel[];
}

export interface MSANData {
  terminal1: Terminal;
  terminal2: Terminal;
}
