import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { DashboardDataService, DashboardData } from '../../../services/dashboard-data.service';

@Component({
    selector: 'app-compliance-tab',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './compliance-tab.component.html',
    styleUrl: './compliance-tab.component.css'
})
export class ComplianceTabComponent implements OnInit, OnDestroy {
    data: DashboardData | null = null;
    private destroy$ = new Subject<void>();

    constructor(private dashboardDataService: DashboardDataService) { }

    ngOnInit(): void {
        this.dashboardDataService.data$
            .pipe(takeUntil(this.destroy$))
            .subscribe(data => {
                this.data = data;
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // Get percentage for progress bars
    getPercentage(value: number, total: number): number {
        if (total === 0) return 0;
        return Math.round((value / total) * 100);
    }

    // Translate equipment names from English (backend) to Arabic
    translateEquipmentName(englishName: string): string {
        const translations: { [key: string]: string } = {
            'Helmet & Shoes': 'خوذة وحذاء واقي',
            'Gloves': 'قفازات واقية',
            'Goggles': 'نظارات واقية',
            'Harness': 'حزام أمان',
            'Gas/Dust Mask': 'قناع واقي ﺿد الغازات والأتربة',
            'Face Shield': 'واقي وﺟه للحرارة',
            'Ear Plugs': 'واقي أذن',
            'Fire Extinguisher': 'ﻃفاية حريق'
        };
        return translations[englishName] || englishName;
    }
}
