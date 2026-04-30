import { Component, inject } from '@angular/core';
import { HpToastService } from './hp-toast.service';

@Component({
  selector: 'hp-toast-stack',
  standalone: true,
  templateUrl: './hp-toast-stack.component.html',
  styleUrl: './hp-toast-stack.component.scss',
})
export class HpToastStackComponent {
  readonly toast = inject(HpToastService);
}
