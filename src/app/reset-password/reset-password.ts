import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, RouterModule],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.css']
})
export class ResetPassword implements OnInit {
  token: string | null = null;
  newPassword = '';
  confirmPassword = '';
  mensaje = '';
  mensajePassword = '';
  mensajeExitoso = false;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token');
    if (!this.token) {
      this.mensaje = "Error: No se proporcionó un token de recuperación o el enlace es incorrecto.";
    }
  }

  cambiarPassword(): void {
    this.mensaje = '';
    if (this.newPassword !== this.confirmPassword) {
      this.mensaje = 'Error: Las contraseñas no coinciden.';
      return;
    }

    if (!this.validarPassword()) {
        this.mensaje = `Error: ${this.mensajePassword || 'La nueva contraseña no cumple los requisitos.'}`;
        return;
    }

    if (!this.token) {
        this.mensaje = "Error: Token no encontrado.";
        return;
    }

    const payload = { token: this.token, newPassword: this.newPassword };

    this.http.post('http://https://mi-primer-proyecto.onrender.comm/reset-password', payload, { responseType: 'text' })
      .subscribe({
        next: (response) => {
          this.mensaje = response;
          this.mensajeExitoso = true;
        },
        error: (err) => {
          this.mensaje = `Error: ${err.error || 'No se pudo cambiar la contraseña.'}`;
          this.mensajeExitoso = false;
        }
      });
  }

  onPasswordChange() {
    const password = this.newPassword;
    this.mensajePassword = '';
    if (password.length === 0) return;
    if (password.length < 8) { this.mensajePassword = 'La contraseña debe tener al menos 8 caracteres'; return; }
    if (!/[A-Z]/.test(password)) { this.mensajePassword = 'La contraseña debe contener al menos una letra mayúscula'; return; }
    if (!/[a-z]/.test(password)) { this.mensajePassword = 'La contraseña debe contener al menos una letra minúscula'; return; }
    if (!/\d/.test(password)) { this.mensajePassword = 'La contraseña debe contener al menos un número'; return; }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) { this.mensajePassword = 'La contraseña debe contener al menos un carácter especial (!@#$%^&*...)'; return; }
  }

  validarPassword(): boolean {
    this.onPasswordChange();
    return this.mensajePassword === '';
  }

  getPasswordStrength(): { level: string; percentage: number; color: string } {
    const password = this.newPassword;
    let score = 0;
    if (password.length >= 8) score += 20;
    if (/[A-Z]/.test(password)) score += 20;
    if (/[a-z]/.test(password)) score += 20;
    if (/\d/.test(password)) score += 20;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 20;
    if (score < 40) return { level: 'Débil', percentage: score, color: '#dc3545' };
    if (score < 80) return { level: 'Media', percentage: score, color: '#ffc107' };
    return { level: 'Fuerte', percentage: score, color: '#28a745' };
  }
}
