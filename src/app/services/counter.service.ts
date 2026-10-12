import { Injectable, computed, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { SavedCounter } from '../models/saved-counter';
export type SortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'value-desc';

@Injectable({
  providedIn: 'root',
})
export class CounterService {
  private readonly storageKey = 'saved-counters';
  private readonly countersState = signal<SavedCounter[]>([]);
  private readonly initializedState = signal(false);
  private initializationPromise: Promise<void> | null = null;

  readonly counters = this.countersState.asReadonly();
  readonly initialized = this.initializedState.asReadonly();

  //signál pro aktuální volbu řazení, výchozí hodnota je 'date-desc'
  readonly sortOption = signal<SortOption>('date-desc');

  //signál pro aktuální vyhledávací dotaz, výchozí hodnota je prázdný řetězec
  readonly searchQuery = signal<string>('');

  //signál pro celkový součet hodnot všech počítadel, je odvozený z signálu countersState
  readonly totalSum = computed(() =>
    this.countersState().reduce((sum, counter) => sum + counter.value, 0),
  );

  //signál pro počet všech počítadel, je odvozený z signálu countersState
  readonly sortedCounters = computed(() => {
    const counters = [...this.countersState()];
    const option = this.sortOption();
    const query = this.searchQuery().toLowerCase().trim();

    //filtrování podle aktuálního vyhledávacího dotazu
    const filtered = counters.filter((counter) =>
      counter.name.toLowerCase().includes(query),
    );

    //seřazení podle aktuální volby řazení
    return filtered.sort((a, b) => {
      switch (option) {
        case 'date-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date-asc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'name-asc':
          return a.name.localeCompare(b.name, 'cs');
        case 'value-desc':
          return b.value - a.value;
        default:
          return 0;
      }
    });
  });

  //metoda pro nastavení aktuální volby řazení
  setSortOption(option: SortOption): void {
    this.sortOption.set(option);
  }

  //metoda pro nastavení aktuálního vyhledávacího dotazu
  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  initialize(): Promise<void> {
    this.initializationPromise ??= this.load();
    return this.initializationPromise;
  }

  async add(counter: SavedCounter): Promise<void> {
    await this.initialize();
    this.countersState.update((counters) => [counter, ...counters]);
    await this.persist();
  }

  async remove(id: string): Promise<void> {
    await this.initialize();
    this.countersState.update((counters) =>
      counters.filter((counter) => counter.id !== id),
    );
    await this.persist();
  }

  async clear(): Promise<void> {
    await this.initialize();
    this.countersState.set([]);
    await Preferences.remove({ key: this.storageKey });
  }

  private async load(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: this.storageKey });

      if (value === null) {
        this.countersState.set([]);
        return;
      }

      const parsed: unknown = JSON.parse(value);

      if (!Array.isArray(parsed)) {
        throw new Error('Uložená historie nemá očekávaný formát pole.');
      }

      this.countersState.set(parsed as SavedCounter[]);
    } catch (error) {
      console.error('Historii počítadel se nepodařilo načíst.', error);
      this.countersState.set([]);
    } finally {
      this.initializedState.set(true);
    }
  }

  private async persist(): Promise<void> {
    await Preferences.set({
      key: this.storageKey,
      value: JSON.stringify(this.countersState()),
    });
  }
}