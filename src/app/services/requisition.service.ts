import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

export interface RequisitionItem {
  id?: string;
  product_id: string;
  quantity_requested: number;
  quantity_fulfilled?: number;
  status?: string;
  notes?: string;
  inventory?: { item_name: string; unit: string };
}

export interface Requisition {
  id: string;
  requester_id: string;
  team_id?: string;
  status: string;
  notes?: string;
  created_at: string;
  fulfilled_at?: string;
  fulfilled_by?: string;
  requester?: { name: string };
  team?: { name: string };
  items?: RequisitionItem[];
}

@Injectable({ providedIn: 'root' })
export class RequisitionService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/requisitions';

  getRequisitions() {
    return firstValueFrom(this.http.get<Requisition[]>(this.apiUrl));
  }

  createRequisition(data: { notes?: string; items: RequisitionItem[] }) {
    return firstValueFrom(this.http.post<Requisition>(this.apiUrl, data));
  }

  fulfillRequisition(id: string, items: RequisitionItem[]) {
    return firstValueFrom(this.http.put<Requisition>(this.apiUrl, { id, items }));
  }
}
