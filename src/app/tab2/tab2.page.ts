import { Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  AlertController,
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { CounterService, SortOption } from '../services/counter.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  imports: [
    DatePipe,
    IonButton,
    IonContent,
    IonHeader,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonTitle,
    IonToolbar,
  ],
})
export class Tab2Page implements OnInit {
  readonly counterService = inject(CounterService);
  
  private readonly alertController = inject(AlertController); // Inject AlertController for displaying confirmation dialogs
  

  async ngOnInit(): Promise<void> {
    await this.counterService.initialize();
  }

  //metoda pro změnu aktuální volby řazení
  onSortChange(event: any): void {
    const value = event.detail.value as SortOption;
    if (value) {
      this.counterService.setSortOption(value);
    }
  }

  //metoda pro změnu aktuálního vyhledávacího dotazu
  onSearchInput(event: any): void {
    const query = event.detail.value ?? '';
    this.counterService.setSearchQuery(query);
  }

  async remove(id: string): Promise<void> {
    await this.counterService.remove(id);
  }

  //metoda pro vymazání celé historie počítadel s potvrzením uživatele
  async clear(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Vymazat historii',
      message: 'Opravdu chcete smazat celou historii počítadel? Tuto akci nelze vrátit.',
      buttons: [
        {
          text: 'Zrušit',
          role: 'cancel',
        },
        {
          text: 'Smazat',
          role: 'destructive',
          handler: async () => {
            await this.counterService.clear();
          },
        },
      ],
    });

    await alert.present();
  }
}