import {
  afterNextRender,
  Component,
  DestroyRef,
  HostListener,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HpBrandLogoComponent } from '../../shared/ui/hp-brand-logo.component';

const INTRO_STORAGE_KEY = 'haspaket_lp_intro_v1';

@Component({
  selector: 'hp-public-page',
  standalone: true,
  imports: [RouterLink, HpBrandLogoComponent],
  templateUrl: './public-page.component.html',
  styleUrl: './public-page.component.scss',
})
export class PublicPageComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly currentYear = new Date().getFullYear();
  readonly scrolled = signal(false);
  readonly showScrollTop = signal(false);
  readonly menuOpen = signal(false);
  readonly introSkip = signal(false);
  readonly reduceMotion = signal(false);

  private observer?: IntersectionObserver;

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.closeMenu());

    afterNextRender(() => {
      if (!isPlatformBrowser(this.platformId)) {
        return;
      }

      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      const syncReduceAndReveals = () => {
        const reduced = mq.matches;
        this.reduceMotion.set(reduced);
        if (reduced) {
          document
            .querySelectorAll('.hp-reveal')
            .forEach((el) => el.classList.add('hp-reveal--visible'));
        }
      };
      syncReduceAndReveals();

      try {
        if (sessionStorage.getItem(INTRO_STORAGE_KEY)) {
          this.introSkip.set(true);
        }
      } catch {
        /* private mode vb. */
      }

      this.syncLandingScrollAfterReload();
      this.syncScrollChrome();

      if (mq.matches) {
        return;
      }

      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('hp-reveal--visible');
              this.observer?.unobserve(entry.target);
            }
          });
        },
        { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.08 },
      );

      document.querySelectorAll('.hp-reveal').forEach((el) => {
        this.observer?.observe(el);
      });
    });

    this.destroyRef.onDestroy(() => {
      this.observer?.disconnect();
    });
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.syncScrollChrome();
  }

  /** Full refresh (F5) must reopen at viewport top without breaking SPA back/forward elsewhere. */
  private syncLandingScrollAfterReload(): void {
    try {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      if (nav?.type !== 'reload') {
        return;
      }
    } catch {
      return;
    }

    const prev = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    const bump = (): void =>
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    bump();
    queueMicrotask(bump);
    requestAnimationFrame(() => bump());
    setTimeout(() => {
      bump();
      history.scrollRestoration = prev;
    }, 0);
  }

  private syncScrollChrome(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const y = window.scrollY;
    this.scrolled.set(y > 8);
    this.showScrollTop.set(y > 280);
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  onDrawerBackdrop(): void {
    this.menuOpen.set(false);
  }

  /**
   * SPA navigasyonu tek kaynaktan; `routerLink + preventDefault()` birlikte ilk tıkta rotayı kilitliyordu.
   * `href="/"` yedek davranış için bırakılıyor, `preventDefault` yalnızca programatik `navigate` ile eşleşir.
   */
  onAnasayfaClick(event: MouseEvent): void {
    event.preventDefault();
    this.closeMenu();
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    void this.router.navigate(['/'], { fragment: 'ust', replaceUrl: true }).then(() => {
      queueMicrotask(() => this.scrollHeroUstIntoView());
    });
  }

  scrollToTop(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  }

  private scrollHeroUstIntoView(): void {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behavior: ScrollBehavior = reduced ? 'auto' : 'smooth';
    const el = document.getElementById('ust');
    if (el) {
      el.scrollIntoView({ behavior, block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior });
    }
  }

  onLogoIntroEnd(event: AnimationEvent): void {
    if (event.animationName !== 'hp-logo-enter') {
      return;
    }
    try {
      sessionStorage.setItem(INTRO_STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
  }
}
