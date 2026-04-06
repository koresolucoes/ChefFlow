import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

export interface Supplier {
  id: string;
  name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  delivery_days?: string[];
  tenant_id?: string;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/suppliers`;

  suppliers = signal<Supplier[]>([]);
  isLoading = signal(false);

  async loadSuppliers() {
    this.isLoading.set(true);
    try {
      const data = await firstValueFrom(this.http.get<Supplier[]>(this.apiUrl));
      this.suppliers.set(data || []);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async addSupplier(supplier: Partial<Supplier>): Promise<boolean> {
    try {
      const newSupplier = await firstValueFrom(this.http.post<Supplier>(this.apiUrl, supplier));
      this.suppliers.update(s => [...s, newSupplier]);
      return true;
    } catch (error) {
      console.error('Error adding supplier:', error);
      return false;
    }
  }

  async updateSupplier(supplier: Partial<Supplier>): Promise<boolean> {
    try {
      const updated = await firstValueFrom(this.http.put<Supplier>(this.apiUrl, supplier));
      this.suppliers.update(s => s.map(sup => sup.id === updated.id ? updated : sup));
      return true;
    } catch (error) {
      console.error('Error updating supplier:', error);
      return false;
    }
  }

  async removeSupplier(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete(`${this.apiUrl}?id=${id}`));
      this.suppliers.update(s => s.filter(sup => sup.id !== id));
      return true;
    } catch (error) {
      console.error('Error removing supplier:', error);
      return false;
    }
  }
}
