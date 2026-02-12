import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  @Output() openProfile = new EventEmitter<void>();

  constructor(
    public authService: AuthService,
    private router: Router
  ) { }

  menuItems = [
    {
      title: 'لوحة التحكم',
      icon: 'dashboard',
      route: '/dashboard',
      active: false
    },
    {
      title: 'تصاريح العمل',
      icon: 'document',
      route: '/work-permits',
      active: true,
      hasChildren: true,
      expanded: false,
      children: [
        {
          title: ' التصاريح',
          route: '/work-permits',
          icon: 'list'
        },
        {
          title: 'إنشاء تصريح',
          route: '/work-permit/new',
          icon: 'plus'
        }
      ]
    },
    {
      title: 'إدارة المستخدمين',
      icon: 'users',
      route: '/users',
      active: false
    }
  ];

  isSidebarOpen = true;
  isProfileExpanded = false;

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  toggleMenuItem(item: any) {
    if (item.hasChildren) {
      item.expanded = !item.expanded;
    }
  }

  toggleProfile() {
    this.isProfileExpanded = !this.isProfileExpanded;
  }

  showProfile() {
    this.openProfile.emit();
    this.isProfileExpanded = false;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getUserInitials(): string {
    const user = this.authService.getCurrentUser();
    if (user?.fullName) {
      const names = user.fullName.split(' ');
      if (names.length >= 2) {
        return names[0][0] + names[1][0];
      }
      return names[0][0];
    }
    return 'U';
  }
}
