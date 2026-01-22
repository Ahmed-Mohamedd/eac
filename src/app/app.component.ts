import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { AuthService } from './services/auth.service';
import { ToastComponent } from './components/toast/toast.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SidebarComponent, ToastComponent, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'airport-msan-viewer';

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
}