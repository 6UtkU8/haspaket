import { Component, computed, inject, input, output } from '@angular/core';
import { ThemeService } from '../../core/theme/theme.service';
import { BRAND_LOGO_DARK, BRAND_LOGO_LIGHT } from '../../core/brand/brand-assets';

@Component({
  selector: 'hp-brand-logo',
  standalone: true,
  template: `
    <img
      [src]="logoSrc()"
      [attr.width]="width() ?? null"
      [attr.height]="height() ?? null"
      [class]="imgClass()"
      [attr.alt]="altText()"
      [attr.loading]="loading()"
      [attr.decoding]="decoding()"
      (animationend)="animationEnd.emit($event)"
    />
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        flex: 0 0 auto;
        max-width: 100%;
        line-height: 0;
        overflow: hidden;
      }

      img {
        display: block;
        width: auto;
        height: auto;
        max-width: min(100%, 11.5rem);
        max-height: 3rem;
        object-fit: contain;
      }
    `,
  ],
})
export class HpBrandLogoComponent {
  private readonly theme = inject(ThemeService);

  readonly imgClass = input<string>('');
  readonly width = input<number | undefined>();
  readonly height = input<number | undefined>();
  readonly altText = input('HasPaket');
  readonly loading = input<'eager' | 'lazy'>('lazy');
  readonly decoding = input<'async' | 'auto' | 'sync'>('async');

  readonly animationEnd = output<AnimationEvent>();

  readonly logoSrc = computed(() =>
    this.theme.mode() === 'light' ? BRAND_LOGO_LIGHT : BRAND_LOGO_DARK,
  );
}
