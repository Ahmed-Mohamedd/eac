import { Injectable } from '@angular/core';
import { MSANData, Panel, Port } from '../models/msan';

@Injectable({
  providedIn: 'root'
})
export class MsanService {

  private msanData: MSANData = {
    terminal1: {
      name: 'Terminal 1',
      location: 'New Hall',
      panels: [
        {
          id: '1-A',
          name: 'Panel 1-A',
          totalPorts: 24,
          used: 18,
          available: 6,
          ports: this.generatePorts(24, 18, [
            { number: 1, user: 'Check-in Counter 1', department: 'Passenger Services', connectionType: 'Ethernet', vlan: '100', notes: 'Main counter system' },
            { number: 2, user: 'Security Gate A1', department: 'Security', connectionType: 'Ethernet', vlan: '200', notes: 'Scanning equipment' },
            { number: 3, user: 'Baggage System 1', department: 'Baggage', connectionType: 'Fiber', vlan: '300', notes: 'Primary baggage line' },
            { number: 4, user: 'Information Desk', department: 'Customer Service', connectionType: 'Ethernet', vlan: '100', notes: '' },
            { number: 5, user: 'Customs Office 1', department: 'Customs', connectionType: 'Ethernet', vlan: '150', notes: 'Immigration system' },
            { number: 6, user: 'Duty Free Shop 1', department: 'Retail', connectionType: 'Ethernet', vlan: '400', notes: 'POS terminal' },
            { number: 7, user: 'Gate Control A2', department: 'Operations', connectionType: 'Ethernet', vlan: '200', notes: '' },
            { number: 8, user: 'Lounge WiFi AP-01', department: 'IT', connectionType: 'Ethernet', vlan: '500', notes: 'Guest WiFi' },
            { number: 9, user: 'CCTV Camera 101', department: 'Security', connectionType: 'PoE', vlan: '250', notes: 'Entrance monitoring' },
            { number: 10, user: 'Boarding Gate A3', department: 'Operations', connectionType: 'Ethernet', vlan: '200', notes: '' },
            { number: 11, user: 'Flight Display 01', department: 'Operations', connectionType: 'Ethernet', vlan: '200', notes: 'FIDS system' },
            { number: 12, user: 'Restaurant POS 1', department: 'Food & Beverage', connectionType: 'Ethernet', vlan: '400', notes: '' },
            { number: 13, user: 'Check-in Counter 2', department: 'Passenger Services', connectionType: 'Ethernet', vlan: '100', notes: '' },
            { number: 14, user: 'Fire Alarm Panel', department: 'Safety', connectionType: 'Ethernet', vlan: '600', notes: 'Critical system' },
            { number: 15, user: 'Immigration Booth 1', department: 'Immigration', connectionType: 'Ethernet', vlan: '150', notes: '' },
            { number: 16, user: 'PA System Control', department: 'Operations', connectionType: 'Ethernet', vlan: '200', notes: 'Public announcement' },
            { number: 17, user: 'Baggage Claim Display', department: 'Baggage', connectionType: 'Ethernet', vlan: '300', notes: '' },
            { number: 18, user: 'Rental Car Counter', department: 'Ground Services', connectionType: 'Ethernet', vlan: '400', notes: '' }
          ])
        },
        {
          id: '1-B',
          name: 'Panel 1-B',
          totalPorts: 24,
          used: 22,
          available: 2,
          ports: this.generateDefaultPorts(24, 22, 'Device')
        },
        {
          id: '1-C',
          name: 'Panel 1-C',
          totalPorts: 48,
          used: 35,
          available: 13,
          ports: this.generateDefaultPorts(48, 35, 'Device')
        }
      ]
    },
    terminal2: {
      name: 'Terminal 2',
      location: 'Old Hall',
      panels: [
        {
          id: '2-A',
          name: 'Panel 2-A',
          totalPorts: 24,
          used: 16,
          available: 8,
          ports: this.generateDefaultPorts(24, 16, 'Terminal 2 Device')
        },
        {
          id: '2-B',
          name: 'Panel 2-B',
          totalPorts: 48,
          used: 40,
          available: 8,
          ports: this.generateDefaultPorts(48, 40, 'Terminal 2 Device')
        }
      ]
    }
  };

  constructor() { }

  getMSANData(): MSANData {
    return this.msanData;
  }

  getTerminal(terminalKey: 'terminal1' | 'terminal2') {
    return this.msanData[terminalKey];
  }

  private generatePorts(total: number, used: number, customPorts: Partial<Port>[]): Port[] {
    const ports: Port[] = [];
    
    for (let i = 1; i <= total; i++) {
      const customPort = customPorts.find(p => p.number === i);
      
      if (customPort && i <= used) {
        ports.push({
          number: i,
          inUse: true,
          user: customPort.user || '',
          department: customPort.department || '',
          connectionType: customPort.connectionType || '',
          vlan: customPort.vlan || '',
          notes: customPort.notes || ''
        });
      } else if (i <= used) {
        ports.push({
          number: i,
          inUse: true,
          user: `Device ${i}`,
          department: 'Operations',
          connectionType: 'Ethernet',
          vlan: '100',
          notes: ''
        });
      } else {
        ports.push({
          number: i,
          inUse: false,
          user: '',
          department: '',
          connectionType: '',
          vlan: '',
          notes: ''
        });
      }
    }
    
    return ports;
  }

  private generateDefaultPorts(total: number, used: number, prefix: string): Port[] {
    const ports: Port[] = [];
    
    for (let i = 1; i <= total; i++) {
      ports.push({
        number: i,
        inUse: i <= used,
        user: i <= used ? `${prefix} ${i}` : '',
        department: i <= used ? 'Operations' : '',
        connectionType: i <= used ? 'Ethernet' : '',
        vlan: i <= used ? '100' : '',
        notes: ''
      });
    }
    
    return ports;
  }
}