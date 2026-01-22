import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Toast {
    id: number;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    private toastsSubject = new BehaviorSubject<Toast[]>([]);
    public toasts$: Observable<Toast[]> = this.toastsSubject.asObservable();
    private nextId = 1;

    constructor() { }

    private show(type: Toast['type'], message: string, duration: number = 3000) {
        const toast: Toast = {
            id: this.nextId++,
            type,
            message,
            duration
        };

        const currentToasts = this.toastsSubject.value;
        this.toastsSubject.next([...currentToasts, toast]);

        // Auto-remove toast after duration
        if (duration > 0) {
            setTimeout(() => this.remove(toast.id), duration);
        }
    }

    success(message: string, duration?: number) {
        this.show('success', message, duration);
    }

    error(message: string, duration?: number) {
        this.show('error', message, duration);
    }

    warning(message: string, duration?: number) {
        this.show('warning', message, duration);
    }

    info(message: string, duration?: number) {
        this.show('info', message, duration);
    }

    remove(id: number) {
        const currentToasts = this.toastsSubject.value;
        this.toastsSubject.next(currentToasts.filter(toast => toast.id !== id));
    }

    clear() {
        this.toastsSubject.next([]);
    }
}
