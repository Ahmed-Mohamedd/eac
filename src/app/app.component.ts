
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { AuthService } from './services/auth.service';
import { ToastComponent } from './components/toast/toast.component';
import { ProfileComponent } from './components/profile/profile.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SidebarComponent, ToastComponent, ProfileComponent, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'eac';
  isMobileSidebarOpen = false;
  showProfileModal = false;

  constructor(
    public authService: AuthService,
    private translate: TranslateService
  ) {
    // Initialize Arabic as default language
    this.translate.setDefaultLang('ar');
    this.translate.use('ar');

    // Set RTL direction for Arabic
    document.dir = 'rtl';
  }

  /**
   * Toggle mobile sidebar open/closed
   */
  toggleMobileSidebar(): void {
    this.isMobileSidebarOpen = !this.isMobileSidebarOpen;
  }

  /**
   * Close sidebar when clicking on overlay (backdrop)
   */
  onSidebarClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    // Close if clicking on the backdrop (::before pseudo-element area)
    if (target.tagName === 'APP-SIDEBAR') {
      this.isMobileSidebarOpen = false;
    }
  }
}