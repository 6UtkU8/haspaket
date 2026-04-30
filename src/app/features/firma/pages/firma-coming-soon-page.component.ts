import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HpPanelCardComponent } from '../../../shared/ui/hp-panel-card.component';

@Component({
  selector: 'hp-firma-coming-soon-page',
  standalone: true,
  imports: [RouterLink, HpPanelCardComponent],
  templateUrl: './firma-coming-soon-page.component.html',
  styleUrl: './firma-coming-soon-page.component.scss',
})
export class FirmaComingSoonPageComponent {}
