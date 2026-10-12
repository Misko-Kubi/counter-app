import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SavedCounter } from '../models/saved-counter';
import { CounterService } from '../services/counter.service';
import { Tab1Page } from './tab1.page';

describe('Tab1Page', () => {
  let component: Tab1Page;
  let fixture: ComponentFixture<Tab1Page>;
  let counterServiceMock: { add: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    counterServiceMock = {
      add: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [Tab1Page],
      providers: [
        { provide: CounterService, useValue: counterServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Tab1Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call CounterService.add when onSaved is triggered', async () => {
    const counter: SavedCounter = {
      id: 'test-id',
      name: 'Test',
      value: 1,
      createdAt: '2026-09-17T08:00:00.000Z',
    };

    await component.onSaved(counter);

    expect(counterServiceMock.add).toHaveBeenCalledWith(counter);
  });
});