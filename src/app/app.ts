import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/theme/theme.service';
import { HpToastStackComponent } from './shared/ui/hp-toast-stack.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HpToastStackComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  /** Uygulama açılışında tema servisini oluşturur; DOM ile localStorage senkron kalır */
  private readonly _theme = inject(ThemeService);
}
