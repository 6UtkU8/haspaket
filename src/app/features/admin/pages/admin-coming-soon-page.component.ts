import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HpPanelCardComponent } from '../../../shared/ui/hp-panel-card.component';

@Component({
  selector: 'hp-admin-coming-soon-page',
  standalone: true,
  imports: [RouterLink, HpPanelCardComponent],
  templateUrl: './admin-coming-soon-page.component.html',
  styleUrl: './admin-coming-soon-page.component.scss',
})
export class AdminComingSoonPageComponent {}
