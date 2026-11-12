import { AfterViewInit, Component, Directive, ElementRef, HostListener, OnDestroy, OnInit, inject, input, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

/** Adds the class "in" the first time the element scrolls into view. */
@Directive({ selector: '[reveal]' })
export class RevealDir implements AfterViewInit, OnDestroy {
  private el: HTMLElement = inject(ElementRef).nativeElement;
  private io?: IntersectionObserver;
  ngAfterViewInit() {
    this.io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { this.el.classList.add('in'); this.io?.disconnect(); }
    }, { threshold: 0.15 });
    this.io.observe(this.el);
  }
  ngOnDestroy() { this.io?.disconnect(); }
}

/** Sets --p (0 to 1): how far the reader has scrolled through the element. */
@Directive({ selector: '[tlProgress]' })
export class ProgressDir implements OnInit, OnDestroy {
  private el: HTMLElement = inject(ElementRef).nativeElement;
  private update = () => {
    const r = this.el.getBoundingClientRect();
    this.el.style.setProperty('--p', String(Math.min(1, Math.max(0, (innerHeight * 0.65 - r.top) / r.height))));
  };
  ngOnInit() { addEventListener('scroll', this.update, { passive: true }); this.update(); }
  ngOnDestroy() { removeEventListener('scroll', this.update); }
}

/** A soft light that follows the mouse. */
@Directive({ selector: '[spot]', host: { '(mousemove)': 'move($event)' } })
export class SpotDir {
  private el: HTMLElement = inject(ElementRef).nativeElement;
  move(e: MouseEvent) {
    const r = this.el.getBoundingClientRect();
    this.el.style.setProperty('--mx', e.clientX - r.left + 'px');
    this.el.style.setProperty('--my', e.clientY - r.top + 'px');
  }
}

/** Counts up to a number when it scrolls into view. */
@Directive({ selector: '[countTo]' })
export class CountDir implements AfterViewInit {
  countTo = input(0);
  private el: HTMLElement = inject(ElementRef).nativeElement;
  ngAfterViewInit() {
    this.el.textContent = '0';
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const n = this.countTo(), t0 = performance.now();
      const tick = (t: number) => {
        const k = Math.min(1, (t - t0) / 1400);
        this.el.textContent = String(Math.round(n * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    io.observe(this.el);
  }
}

@Component({
  selector: 'app-root',
  imports: [RevealDir, ProgressDir, SpotDir, CountDir],
  template: `
<div class="pbar" [style.width.%]="pct()"></div>
@if (p(); as d) {
  <header class="bar">
    <span class="mark">{{ d.name }}</span>
    <a class="pill" [href]="cv" download>Download CV</a>
  </header>

  <section class="hero" spot>
    <div class="hero-in">
      <div class="copy">
        <p class="hi">Hello, I'm</p>
        <h1>@for (w of d.name.split(' '); track $index) {<span class="w"><span [style.--i]="$index">{{ w }}</span></span>}</h1>
        <p class="role">{{ d.title }}</p>
        <p class="type">Building with <b>{{ typed() }}</b><i></i></p>
        <p class="sum">{{ d.summary }}</p>
        <div class="cta">
          <!-- <a class="btn" [href]="cv" download>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0l-5-5m5 5l5-5M5 21h14"/></svg>
            Download CV
          </a> -->
          @for (l of d.links; track l.url) { <a class="ghost" [href]="l.url" target="_blank" rel="noopener">{{ l.label }}</a> }
        </div>
        <!-- <div class="stats">
          <div><b [countTo]="stats(d)[0]"></b><span>Roles</span></div>
          <div><b [countTo]="stats(d)[1]"></b><span>Technologies</span></div>
          <div><b [countTo]="stats(d)[2]"></b><span>Companies</span></div>
        </div> -->
      </div>
      <div class="photo">
        <span class="ring"></span><span class="block"></span>
        <img src="photo.jpg" [alt]="d.name">
        <span class="tag t1">Java</span><span class="tag t2">Spring Boot</span><span class="tag t3">Angular</span>
      </div>
    </div>
  </section>

  <div class="ticker" aria-hidden="true">
    <div class="track">@for (n of [0, 1]; track n) { @for (t of techs(d); track $index) { <span>{{ t }}</span> } }</div>
  </div>

  <main>
    <section>
      <h2 reveal>{{ d.labels?.experience }}</h2>
      <ol class="timeline" tlProgress>
        @for (e of d.experience; track $index) {
          <li reveal>
            <h3>{{ e.role }} <span class="co">{{ e.company }}</span></h3>
            @if (e.period) { <p class="period">{{ e.period }}</p> }
            <ul>@for (pt of e.points; track pt) { <li>{{ pt }}</li> }</ul>
          </li>
        }
      </ol>
    </section>

        @if (d.projects?.length) {
      <section>
        <h2 reveal>Projects</h2>
        @for (pr of d.projects; track pr.name) {
          <article class="proj" reveal>
            <div class="shot">
              <div class="dots"><i></i><i></i><i></i></div>
              @if (pr.image) { <img [src]="pr.image" [alt]="pr.name + ' screenshot'"> }
              @else { <div class="ph">{{ pr.name }}</div> }
            </div>
            <div class="info">
              <h3>{{ pr.name }}</h3>
              <p class="desc">{{ pr.description }}</p>
              <ul class="hl">@for (h of pr.highlights; track h) { <li>{{ h }}</li> }</ul>
              <p class="tech">@for (t of pr.tech; track t) { <span>{{ t }}</span> }</p>
              <p class="plinks">
                @if (pr.github) { <a class="pbtn" [href]="pr.github" target="_blank" rel="noopener">View on GitHub</a> }
                @if (pr.demo) { <a class="pbtn alt" [href]="pr.demo" target="_blank" rel="noopener">Live demo</a> }
              </p>
            </div>
          </article>
        }
      </section>
    }

    <section>
      <h2 reveal>{{ d.labels?.skills }}</h2>
      @for (g of d.skills; track g.group) {
        <div class="group" reveal>
          <h3>{{ g.group }}</h3>
          <p>@for (s of g.items; track s) { <span class="chip" [style.--i]="$index">{{ s }}</span> }</p>
        </div>
      }
    </section>

    <section>
      <h2 reveal>{{ d.labels?.education }}</h2>
      @for (e of d.education; track e.title) {
        <p class="edu rv" reveal><strong>{{ e.title }}</strong><br>{{ e.place }}, {{ e.period }}</p>
      }
      <h3 class="rv" reveal>{{ d.labels?.languages }}</h3>
      <p class="rv" reveal>{{ d.languages.join(' / ') }}</p>
    </section>
  </main>

  <footer class="foot" spot>
    <h2 reveal>Let's build something together.</h2>
    <a class="mail" [href]="d.links[0]?.url">{{ (d.links[0]?.url ?? '').replace('mailto:', '') }}</a>
    <!-- <div class="cta"><a class="btn" [href]="cv" download>Download CV</a></div> -->
  </footer>
}`
})
export class App implements OnDestroy {
  private http = inject(HttpClient);
  p = signal<any>(null);
  typed = signal('');
  pct = signal(0);
  cv = 'Mayson_Said_Shaaban_CV.pdf';
  private timer: any;

  constructor() {
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
    this.http.get('/api/profile?lang=en').subscribe(d => this.p.set(d));
    this.type(['Spring Boot', 'Angular', 'REST APIs', 'JasperReports', 'Clean code']);
  }

  @HostListener('window:scroll') onScroll() {
    const h = document.documentElement;
    this.pct.set((h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)) * 100);
  }

  techs(d: any): string[] { return (d.skills ?? []).flatMap((g: any) => g.items); }
  stats(d: any): number[] {
    return [d.experience.length, this.techs(d).length, new Set(d.experience.map((e: any) => e.company)).size];
  }

  private type(words: string[]) {
    let w = 0, i = 0, del = false;
    this.timer = setInterval(() => {
      const word = words[w];
      i += del ? -1 : 1;
      this.typed.set(word.slice(0, Math.max(0, i)));
      if (!del && i >= word.length) { del = true; i = word.length + 12; }
      else if (del && i <= 0) { del = false; w = (w + 1) % words.length; i = 0; }
    }, 85);
  }
  ngOnDestroy() { clearInterval(this.timer); }
}
