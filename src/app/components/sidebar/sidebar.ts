import { Component, output, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';

interface MenuItem {
  label: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [ButtonModule, RippleModule, TooltipModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  collapsed = signal(false);
  collapsedChange = output<boolean>();

  menuItems: MenuItem[] = [
    { label: 'Inicio', icon: 'pi pi-home' },
    { label: 'Inventario', icon: 'pi pi-box' },
    { label: 'Ventas', icon: 'pi pi-shopping-cart' },
    { label: 'Finanzas', icon: 'pi pi-wallet' },
    { label: 'Recursos Humanos', icon: 'pi pi-users' },
    { label: 'Reportes', icon: 'pi pi-chart-bar' },
    { label: 'Configuracion', icon: 'pi pi-cog' },
  ];

  toggleSidebar(): void {
    this.collapsed.set(!this.collapsed());
    this.collapsedChange.emit(this.collapsed());
  }
}
