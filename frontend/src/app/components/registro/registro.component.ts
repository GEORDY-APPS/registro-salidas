// src/app/components/registro/registro.component.ts
import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SalidasService } from '../../services/salidas.service';
import { ReniecService } from '../../services/reniec.service';
import { AdminComponent } from '../admin/admin.component';

const EMPRESAS_CONFIG: Record<string, { rutaDefault: string }> = {
  'China Civil': { rutaDefault: 'Cusco - Challhuahuacho' },
  'CWE':         { rutaDefault: 'Cusco - Challhuahuacho' },
  'SINAR':       { rutaDefault: 'Cusco - Challhuahuacho' },
  'COMPANY':     { rutaDefault: 'Cusco - Challhuahuacho' },
};

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminComponent],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.css']
})
export class RegistroComponent implements AfterViewInit {

  @ViewChild('firmaCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  // Formulario
  empresaSeleccionada = '';
  dni    = '';
  nombre = '';
  empresas = Object.keys(EMPRESAS_CONFIG);

  // Estado UI
  buscandoDNI    = false;
  nombreReadOnly = false;
  guardando      = false;
  sidebarOpen    = false;

  // Firma
  private ctx!: CanvasRenderingContext2D;
  private dibujando = false;

  constructor(
    public auth: AuthService,
    private salidas: SalidasService,
    private reniec: ReniecService,
    private router: Router
  ) {}

  ngAfterViewInit(): void {
    this.initCanvas();
    window.addEventListener('resize', () => this.ajustarCanvas());
  }

  // ── CANVAS ─────────────────────────────────────────────────────────────────
  private initCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.ajustarCanvas();

    // Mouse
    canvas.addEventListener('mousedown',  e => this.startDraw(e));
    canvas.addEventListener('mousemove',  e => this.draw(e));
    canvas.addEventListener('mouseup',    () => this.stopDraw());
    canvas.addEventListener('mouseleave', () => this.stopDraw());

    // Touch
    canvas.addEventListener('touchstart', e => { e.preventDefault(); this.startDraw(e.touches[0]); }, { passive: false });
    canvas.addEventListener('touchmove',  e => { e.preventDefault(); this.draw(e.touches[0]); },     { passive: false });
    canvas.addEventListener('touchend',   () => this.stopDraw());
  }

  private ajustarCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.width  = canvas.offsetWidth;
    canvas.height = 120;
    this.ctx.lineWidth   = 3;
    this.ctx.lineCap     = 'round';
    this.ctx.strokeStyle = '#000000';
  }

  private getPos(e: MouseEvent | Touch): { x: number; y: number } {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  startDraw(e: MouseEvent | Touch): void {
    this.dibujando = true;
    const p = this.getPos(e);
    this.ctx.beginPath();
    this.ctx.moveTo(p.x, p.y);
  }

  draw(e: MouseEvent | Touch): void {
    if (!this.dibujando) return;
    const p = this.getPos(e);
    this.ctx.lineTo(p.x, p.y);
    this.ctx.stroke();
  }

  stopDraw(): void { this.dibujando = false; }

  limpiarFirma(): void {
    const c = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, c.width, c.height);
  }

  private getFirmaBase64(): string | null {
    const canvas = this.canvasRef.nativeElement;
    const pixels = this.ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    if (!Array.from(pixels).some(p => p !== 0)) return null;

    const tmp = document.createElement('canvas');
    tmp.width  = canvas.width;
    tmp.height = canvas.height;
    const tCtx = tmp.getContext('2d')!;
    tCtx.fillStyle = '#FFFFFF';
    tCtx.fillRect(0, 0, tmp.width, tmp.height);
    tCtx.drawImage(canvas, 0, 0);
    return tmp.toDataURL('image/jpeg', 0.6);
  }

  // ── RENIEC ──────────────────────────────────────────────────────────────────
  onDniInput(): void {
    this.dni = String(this.dni).replace(/\D/g, '').slice(0, 8);
    if (this.dni.length !== 8) return;

    this.nombre        = 'BUSCANDO...';
    this.nombreReadOnly = true;
    this.buscandoDNI   = true;

    this.reniec.consultarDNI(this.dni).subscribe({
      next: res => {
        this.buscandoDNI = false;
        if (res?.full_name) {
          this.nombre         = res.full_name.toUpperCase();
          this.nombreReadOnly = true;
        } else {
          this.nombre         = '';
          this.nombreReadOnly = false;
        }
      },
      error: () => {
        this.buscandoDNI    = false;
        this.nombre         = '';
        this.nombreReadOnly = false;
      }
    });
  }

  // ── GUARDAR ─────────────────────────────────────────────────────────────────
  guardar(): void {
    if (!this.empresaSeleccionada) { alert('⚠️ Seleccionar empresa'); return; }
    if (!this.dni || !this.nombre || this.nombre === 'BUSCANDO...') {
      alert('❌ Complete los datos');
      return;
    }
    const firma = this.getFirmaBase64();
    if (!firma) { alert('❌ Debe firmar'); return; }

    this.guardando = true;
    this.salidas.guardar({
      empresa:   this.empresaSeleccionada,
      ruta:      EMPRESAS_CONFIG[this.empresaSeleccionada].rutaDefault,
      dni:       this.dni,
      nombre:    this.nombre,
      firma_b64: firma
    }).subscribe({
      next: () => {
        this.guardando = false;
        alert('✅ Registrado correctamente');
        this.resetForm();
      },
      error: err => {
        this.guardando = false;
        alert('❌ Error: ' + (err.error?.error ?? 'Intente de nuevo'));
      }
    });
  }

  private resetForm(): void {
    this.dni                = '';
    this.nombre             = '';
    this.nombreReadOnly     = false;
    this.empresaSeleccionada = '';
    this.limpiarFirma();
  }

  // ── SIDEBAR ─────────────────────────────────────────────────────────────────
  toggleSidebar(): void  { this.sidebarOpen = !this.sidebarOpen; }
  cerrarSidebar(): void  { this.sidebarOpen = false; }
  logout(): void         { this.auth.logout(); }
}
