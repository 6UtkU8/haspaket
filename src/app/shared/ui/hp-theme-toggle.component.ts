import { Component, inject } from '@angular/core';
import { ThemeService } from '../../core/theme/theme.service';

@Component({
  selector: 'hp-theme-toggle',
  standalone: true,
  templateUrl: './hp-theme-toggle.component.html',
  styleUrl: './hp-theme-toggle.component.scss',
})
export class HpThemeToggleComponent {
  readonly theme = inject(ThemeService);

  onClick(): void {
    this.theme.toggle();
  }
}
