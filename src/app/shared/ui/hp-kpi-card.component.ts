import { DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';

export type HpKpiIcon =
  | 'package'
  | 'check'
  | 'user'
  | 'money'
  | 'building'
  | 'users';

@Component({
  selector: 'hp-kpi-card',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './hp-kpi-card.component.html',
  styleUrl: './hp-kpi-card.component.scss',
})
export class HpKpiCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<number>();
  readonly hint = input('');
  readonly icon = input<HpKpiIcon>('package');
  readonly isCurrency = input(false);
}
