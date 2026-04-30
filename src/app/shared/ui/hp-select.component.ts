import {
  CdkConnectedOverlay,
  CdkOverlayOrigin,
  Overlay,
  STANDARD_DROPDOWN_BELOW_POSITIONS,
} from '@angular/cdk/overlay';
import { Component, computed, inject, input, model, signal } from '@angular/core';

export interface HpSelectOption {
  value: string;
  label: string;
}

let hpSelectUid = 0;

@Component({
  selector: 'hp-select',
  standalone: true,
  imports: [CdkConnectedOverlay, CdkOverlayOrigin],
  templateUrl: './hp-select.component.html',
  styleUrl: './hp-select.component.scss',
})
export class HpSelectComponent {
  private readonly overlay = inject(Overlay);

  /** Seçenekler */
  readonly options = input.required<HpSelectOption[]>();
  /** Seçili değer */
  readonly value = model<string>('');
  /** Üst etiket (tek satır; boş bırakılabilir) */
  readonly label = input<string>('');
  readonly placeholder = input<string>('Seçin');
  readonly disabled = input(false);

  readonly open = signal(false);
  readonly uid = `hp-sel-${hpSelectUid++}`;
  readonly labelId = `${this.uid}-lbl`;
  readonly listboxId = `${this.uid}-listbox`;

  readonly dropdownPositions = STANDARD_DROPDOWN_BELOW_POSITIONS;
  readonly scrollStrategy = this.overlay.scrollStrategies.reposition();

  readonly selectedLabel = computed(() => {
    const v = this.value();
    return this.options().find((o) => o.value === v)?.label ?? '';
  });

  readonly activeIndex = signal(0);

  toggle(): void {
    if (this.disabled()) {
      return;
    }
    this.open.update((o) => !o);
    if (this.open()) {
      const ix = this.options().findIndex((o) => o.value === this.value());
      this.activeIndex.set(ix >= 0 ? ix : 0);
    }
  }

  close(): void {
    this.open.set(false);
  }

  onOverlayOutsideClick(): void {
    this.close();
  }

  selectOption(opt: HpSelectOption): void {
    this.value.set(opt.value);
    this.close();
  }

  onTriggerKeydown(ev: KeyboardEvent): void {
    if (this.disabled()) {
      return;
    }
    if (ev.key === 'ArrowDown' || ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      if (!this.open()) {
        this.open.set(true);
        const ix = this.options().findIndex((o) => o.value === this.value());
        this.activeIndex.set(ix >= 0 ? ix : 0);
      }
    } else if (ev.key === 'Escape' && this.open()) {
      ev.preventDefault();
      this.close();
    }
  }

  onListKeydown(ev: KeyboardEvent): void {
    const opts = this.options();
    if (!opts.length) {
      return;
    }
    let i = this.activeIndex();
    if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      i = Math.min(opts.length - 1, i + 1);
      this.activeIndex.set(i);
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      i = Math.max(0, i - 1);
      this.activeIndex.set(i);
    } else if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      const opt = opts[i];
      if (opt) {
        this.selectOption(opt);
      }
    } else if (ev.key === 'Escape') {
      ev.preventDefault();
      this.close();
    } else if (ev.key === 'Home') {
      ev.preventDefault();
      this.activeIndex.set(0);
    } else if (ev.key === 'End') {
      ev.preventDefault();
      this.activeIndex.set(opts.length - 1);
    }
  }
}
