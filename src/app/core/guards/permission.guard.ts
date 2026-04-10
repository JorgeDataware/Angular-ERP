import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PermissionModule, PermissionAction } from '../models/permission';

/**
 * Guard de permisos que usa el formato frontend (module, action)
 * y lo traduce al formato backend (e.g. 'canRead_Groups').
 * Se usa en las rutas: permissionGuard('groups', 'view')
 */
export function permissionGuard(module: PermissionModule, action: PermissionAction): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.hasPermission(module, action)) {
      return true;
    }

    router.navigate(['/dashboard']);
    return false;
  };
}
