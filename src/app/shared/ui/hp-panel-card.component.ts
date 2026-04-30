import { Component, input } from '@angular/core';

/** Panel kart kabuğu — firma / admin dashboard ortak */
@Component({
  selector: 'hp-panel-card',
  standalone: true,
  template: `
    <section class="hp-pcard">
      @if (title() || toolbar()) {
        <div
          class="hp-pcard__head"
          [class.hp-pcard__head--toolbar-only]="toolbar() && !title()"
        >
          @if (title()) {
            <h2 class="hp-pcard__title">{{ title() }}</h2>
          }
          <ng-content select="[panel-actions]" />
        </div>
      }
      <div class="hp-pcard__body">
        <ng-content />
      </div>
    </section>
  `,
  styleUrl: './hp-panel-card.component.scss',
})
export class HpPanelCardComponent {
  readonly title = input<string>('');
  /** Başlık olmadan üst şerit (ör. harita kartında yalnız rozet) */
  readonly toolbar = input(false);
}
