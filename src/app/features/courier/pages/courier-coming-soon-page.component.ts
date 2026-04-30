import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HpPanelCardComponent } from '../../../shared/ui/hp-panel-card.component';

@Component({
  selector: 'hp-courier-coming-soon-page',
  standalone: true,
  imports: [RouterLink, HpPanelCardComponent],
  templateUrl: './courier-coming-soon-page.component.html',
  styleUrl: './courier-coming-soon-page.component.scss',
})
export class CourierComingSoonPageComponent {}
