import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ExportService {
  exportToCsv(filename: string, data: Record<string, unknown>[], headers: { key: string; label: string }[]) {
    if (!data || !data.length) {
      alert('Não há dados para exportar.');
      return;
    }
    
    const csvContent = [
      headers.map(h => `"${h.label.replace(/"/g, '""')}"`).join(','),
      ...data.map(row => 
        headers.map(h => {
          const value = row[h.key];
          const str = String(value ?? '');
          return `"${str.replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // \uFEFF for Excel UTF-8 BOM
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
