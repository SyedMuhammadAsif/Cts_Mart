import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageProfile } from './manage-profile';

describe('ManageProfile', () => {
  let component: ManageProfile;
  let fixture: ComponentFixture<ManageProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageProfile]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageProfile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
}); 