import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-loading-spinner',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './loading-spinner.component.html',
    styleUrl: './loading-spinner.component.css'
})
export class LoadingSpinnerComponent {
    /**
     * Size of the spinner
     * @default 'medium'
     */
    @Input() size: 'small' | 'medium' | 'large' = 'medium';

    /**
     * Color of the spinner
     * @default 'primary' (blue)
     */
    @Input() color: 'primary' | 'white' | 'success' | 'danger' = 'primary';

    /**
     * Optional loading text message (supports Arabic)
     * @default undefined
     */
    @Input() message?: string;

    /**
     * Display mode - inline or overlay
     * @default 'inline'
     */
    @Input() mode: 'inline' | 'overlay' = 'inline';

    /**
     * Show message below spinner or inline
     * @default 'below'
     */
    @Input() messagePosition: 'below' | 'inline' = 'below';

    getSizeClass(): string {
        return `spinner-${this.size}`;
    }

    getColorClass(): string {
        return `spinner-${this.color}`;
    }
}
