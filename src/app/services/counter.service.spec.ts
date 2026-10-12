import { TestBed } from '@angular/core/testing';
import { Preferences } from '@capacitor/preferences';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SavedCounter } from '../models/saved-counter';
import { CounterService } from './counter.service';

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

describe('CounterService', () => {
  let service: CounterService;

  const getMock = vi.mocked(Preferences.get);
  const setMock = vi.mocked(Preferences.set);
  const removeMock = vi.mocked(Preferences.remove);

  const first: SavedCounter = {
    id: 'first',
    name: 'První',
    value: 1,
    createdAt: '2026-09-17T08:00:00.000Z',
  };

  const second: SavedCounter = {
    id: 'second',
    name: 'Druhé',
    value: 2,
    createdAt: '2026-09-17T09:00:00.000Z',
  };

  beforeEach(() => {
    // Vynulujeme počty volání mocků z předchozího testu.
    vi.clearAllMocks();

    // Výchozí stav: v Preferences zatím není uložená historie.
    getMock.mockResolvedValue({ value: null });

    // Zápis i odstranění ve výchozím stavu úspěšně skončí.
    setMock.mockResolvedValue(undefined);
    removeMock.mockResolvedValue(undefined);

    // Pro každý test vytvoříme nové prostředí Angular dependency injection.
    TestBed.configureTestingModule({
      providers: [CounterService],
    });

    // Z testovacího injectoru získáme čerstvou instanci služby.
    service = TestBed.inject(CounterService);
  });

  it('should initialize only once', async () => {
    // Dvě volání bez čekání simulují souběžné požadavky na inicializaci.
    await Promise.all([service.initialize(), service.initialize()]);

    // Další volání proběhne až po dokončení první inicializace.
    await service.initialize();

    // Všechna volání musí sdílet jedinou operaci načtení Preferences.
    expect(getMock).toHaveBeenCalledTimes(1);

    // Služba dokončila inicializaci a při value: null má prázdnou historii.
    expect(service.initialized()).toBe(true);
    expect(service.counters()).toEqual([]);
  });

  // Testy 

  it('should load saved counters on initialization', async () => {
    
    getMock.mockResolvedValue({
      value: JSON.stringify([first, second]),
    });

    // Inicializuje službu
    await service.initialize();

    // Ověří, že se data načetla do signálu a volal se správný klíč
    expect(service.counters()).toEqual([first, second]);
    expect(getMock).toHaveBeenCalledWith({ key: 'saved-counters' });
    expect(service.initialized()).toBe(true);
  });

  it('should add a counter and persist it', async () => {
    // Přidá nový záznam
    await service.add(first);

    // Ověří, že je v signálu na prvním místě a že proběhl zápis do Preferences
    expect(service.counters()).toEqual([first]);
    expect(setMock).toHaveBeenCalledWith({
      key: 'saved-counters',
      value: JSON.stringify([first]),
    });
  });

  it('should remove a counter by id and persist', async () => {
    // Připraví si počáteční data ve službě
    getMock.mockResolvedValue({
      value: JSON.stringify([first, second]),
    });
    await service.initialize();

    // Odstraní první záznam podle jeho ID
    await service.remove(first.id);

    // Ověřením zjistíme, že zbylo pouze druhé počítadlo a stav se uložil
    expect(service.counters()).toEqual([second]);
    expect(setMock).toHaveBeenCalledWith({
      key: 'saved-counters',
      value: JSON.stringify([second]),
    });
  });

  it('should clear all counters and remove preferences key', async () => {
    // Inicializuje službu s nějakými daty
    getMock.mockResolvedValue({
      value: JSON.stringify([first, second]),
    });
    await service.initialize();

    // Vymaže historii
    await service.clear();

    // Ověří, že signál je prázdný a volalo se odstranění klíče
    expect(service.counters()).toEqual([]);
    expect(removeMock).toHaveBeenCalledWith({ key: 'saved-counters' });
  });

  it('should recover from invalid JSON', async () => {
    // Preferences vrátí neplatný JSON řetězec
    getMock.mockResolvedValue({
      value: 'this is not a valid JSON',
    });

    // Zachytí výpis chyby do konzole, aby nerušil výstup testů
    const errorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    await service.initialize();

    // Služba nesmí spadnout, musí nastavit prázdnou historii a zalogovat chybu
    expect(service.counters()).toEqual([]);
    expect(service.initialized()).toBe(true);
    expect(errorSpy).toHaveBeenCalledWith(
      'Historii počítadel se nepodařilo načíst.',
      expect.any(Error),
    );

    errorSpy.mockRestore();
  });
  
});