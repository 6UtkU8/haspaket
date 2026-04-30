import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HpPanelCardComponent } from '../../../shared/ui/hp-panel-card.component';
import { HpToastService } from '../../../shared/ui/hp-toast.service';
import { CourierSettingsService } from '../settings/courier-settings.service';

type CourierModuleId =
  | 'profil'
  | 'teslimat'
  | 'bildirim'
  | 'gorunum'
  | 'guvenlik';

@Component({
  selector: 'hp-courier-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule, HpPanelCardComponent],
  templateUrl: './courier-settings-page.component.html',
  styleUrls: ['./courier-settings-page.component.scss'],
})
export class CourierSettingsPageComponent {
  readonly settings = inject(CourierSettingsService);
  private readonly toast = inject(HpToastService);

  readonly activeModule = signal<CourierModuleId>('profil');
  readonly currentPassword = signal('');
  readonly newPassword = signal('');

  readonly modules: ReadonlyArray<{
    id: CourierModuleId;
    icon: string;
    title: string;
    desc: string;
  }> = [
    {
      id: 'profil',
      icon: 'PR',
      title: 'Profil',
      desc: 'Kimlik ve iletişim bilgileri',
    },
    {
      id: 'teslimat',
      icon: 'TS',
      title: 'Teslimat Akışı',
      desc: 'Çevrim içi ve konum tercihleri',
    },
    {
      id: 'bildirim',
      icon: 'BD',
      title: 'Bildirimler',
      desc: 'Ses, titreşim ve mola uyarıları',
    },
    {
      id: 'gorunum',
      icon: 'GR',
      title: 'Görünüm',
      desc: 'Tema, dil ve liste düzeni',
    },
    {
      id: 'guvenlik',
      icon: 'GV',
      title: 'Güvenlik',
      desc: 'Şifre güncelleme alanı',
    },
  ];

  setActiveModule(moduleId: CourierModuleId): void {
    this.activeModule.set(moduleId);
  }

  onThemePick(value: string): void {
    if (value !== 'light' && value !== 'dark' && value !== 'system') {
      return;
    }
    this.settings.setThemePreference(value);
  }

  onLanguagePick(value: string): void {
    this.settings.setLanguage(value);
  }

  onLocationPrecisionPick(value: string): void {
    if (!['high', 'balanced', 'district'].includes(value)) {
      return;
    }
    this.settings.locationPrecision.set(value);
  }

  save(): void {
    const passwordError = this.settings.validatePasswordFields(
      this.currentPassword(),
      this.newPassword(),
    );
    if (passwordError) {
      this.toast.show('Kayıt yapılamadı', passwordError);
      return;
    }

    this.settings.persist();
    const hadPasswordUpdate = !!(
      this.currentPassword().trim() || this.newPassword().trim()
    );
    this.currentPassword.set('');
    this.newPassword.set('');
    this.toast.show(
      'Ayarlar kaydedildi.',
      hadPasswordUpdate
        ? 'Şifre doğrulaması (demo) başarılı.'
        : undefined,
      2600,
    );
  }

  reset(): void {
    this.settings.resetToDefaults();
    this.currentPassword.set('');
    this.newPassword.set('');
    this.toast.show('Varsayılan ayarlar yüklendi.');
  }
}
