import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkPermitComponent } from './work-permit.component';

describe('WorkPermitComponent', () => {
  let component: WorkPermitComponent;
  let fixture: ComponentFixture<WorkPermitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkPermitComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WorkPermitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
