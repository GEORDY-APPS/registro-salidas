// src/app/components/admin/admin.component.ts
import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SalidasService } from '../../services/salidas.service';
import { Salida } from '../../models/salida.model';

declare var jspdf: any;
declare var XLSX: any;

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnChanges {
  @Input()  open  = false;
  @Output() cerrar = new EventEmitter<void>();

  empresas = ['China Civil', 'CWE', 'SINAR', 'COMPANY'];
  empresaDescarga = 'China Civil';
  totalRegistros = 0;
  cargando = false;

  constructor(private auth: AuthService, private salidas: SalidasService) {}

  ngOnChanges(): void {
    if (this.open) this.cargarConteo();
  }

  cargarConteo(): void {
    this.salidas.getSalidas().subscribe({
      next: (data) => this.totalRegistros = data.length,
      error: () => {}
    });
  }

  descargarPDF(): void {
    this.cargando = true;
    this.salidas.getSalidas(this.empresaDescarga).subscribe({
      next: (registros) => {
        this.cargando = false;
        if (!registros.length) { alert('No hay datos.'); return; }

        const { jsPDF } = (window as any).jspdf;
        const doc = new jsPDF();
        doc.setFontSize(14);
        doc.text(`REPORTE: ${this.empresaDescarga.toUpperCase()}`, 14, 20);

        (doc as any).autoTable({
          startY: 30,
          head: [['Fecha', 'Ruta', 'DNI', 'Nombre', 'Firma']],
          body: registros.map((r: Salida) => [r.fecha, r.ruta, r.dni, r.nombre, '']),
          didDrawCell: (data: any) => {
            if (data.column.index === 4 && data.cell.section === 'body') {
              const img = registros[data.row.index].firma_b64;
              if (img) doc.addImage(img, 'JPEG', data.cell.x + 2, data.cell.y + 2, 20, 10);
            }
          },
          styles: { minCellHeight: 15, verticalAlign: 'middle' }
        });
        doc.save(`Reporte_${this.empresaDescarga}.pdf`);
      },
      error: () => { this.cargando = false; alert('Error al descargar'); }
    });
  }

  descargarExcel(): void {
    this.cargando = true;
    this.salidas.getSalidas(this.empresaDescarga).subscribe({
      next: (registros) => {
        this.cargando = false;
        if (!registros.length) { alert('Sin datos.'); return; }

        const data = registros.map((r: Salida) => ({
          Fecha: r.fecha, Ruta: r.ruta, DNI: r.dni, Nombre: r.nombre
        }));
        const ws = (window as any).XLSX.utils.json_to_sheet(data);
        ws['!cols'] = [{ wch: 20 }, { wch: 25 }, { wch: 12 }, { wch: 35 }];
        const wb = (window as any).XLSX.utils.book_new();
        (window as any).XLSX.utils.book_append_sheet(wb, ws, 'Data');
        (window as any).XLSX.writeFile(wb, `Excel_${this.empresaDescarga}.xlsx`);
      },
      error: () => { this.cargando = false; alert('Error al descargar'); }
    });
  }

  borrarTodo(): void {
    if (!confirm('⚠️ ¿Borrar TODOS los registros de la nube?')) return;
    const pass = prompt('Contraseña de administrador:');
    if (pass !== '76161525') { alert('Contraseña incorrecta'); return; }

    this.salidas.borrarTodo().subscribe({
      next: () => { alert('✅ Base de datos limpia'); this.totalRegistros = 0; },
      error: () => alert('Error al borrar')
    });
  }

  logout(): void { this.auth.logout(); }
  close(): void  { this.cerrar.emit(); }
}
