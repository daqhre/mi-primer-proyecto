import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-recuperar-password',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, RouterModule],
  templateUrl: './recuperar-password.component.html',
  styleUrls: ['./recuperar-password.component.css']
})
export class RecuperarPasswordComponent {
  datos = {
    email: '',
    codigoVerificacion: '',
    newPassword: '',
    confirmPassword: ''
  };
  mensaje = '';
  mensajePassword = '';
  cambioExitoso = false;
  codigoEnviado = false;
  cargando = false;

  constructor(
    private http: HttpClient, 
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  solicitarCodigo() {
    this.mensaje = '';
    this.cargando = true;
    if (!this.datos.email) {
      this.mensaje = 'Por favor, ingresa tu correo electrónico.';
      this.cargando = false;
      return;
    }

    const payload = { email: this.datos.email };
    this.http.post('http://https://mi-primer-proyecto.onrender.comm/recuperar-password', payload, { responseType: 'text' })
      .subscribe({
        next: (response) => {
          this.mensaje = response;
          this.codigoEnviado = true;
          this.cargando = false;
          this.cdr.detectChanges(); // Forzamos a Angular a mostrar los campos de código
        },
        error: (err) => {
          this.mensaje = `Error: ${err.error || 'Ocurrió un error al enviar el código.'}`;
          this.codigoEnviado = false;
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
  }

  cambiarPassword() {
    this.mensaje = '';
    this.cambioExitoso = false;

    if (!this.codigoEnviado) {
      this.mensaje = 'Primero debes solicitar el código de verificación a tu correo.';
      return;
    }

    if (!this.datos.codigoVerificacion) {
      this.mensaje = 'Por favor, ingresa el código de verificación que recibiste.';
      return;
    }

    if (this.datos.newPassword !== this.datos.confirmPassword) {
      this.mensaje = 'Error: La nueva contraseña y su confirmación no coinciden.';
      return;
    }

    if (!this.validarPassword()) {
      this.mensaje = `Error: ${this.mensajePassword || 'La nueva contraseña no cumple los requisitos.'}`;
      return;
    }

    this.cargando = true;
    const payload = {
      email: this.datos.email,
      codigoVerificacion: this.datos.codigoVerificacion,
      newPassword: this.datos.newPassword
    };

    this.http.post('http://https://mi-primer-proyecto.onrender.comm/recuperar-password', payload, { responseType: 'text' })
      .subscribe({
        next: (response) => {
          this.mensaje = response;
          this.cambioExitoso = true;
          this.cargando = false;
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.mensaje = `Error: ${err.error || 'Ocurrió un error desconocido.'}`;
          this.cambioExitoso = false;
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
  }

  onPasswordChange() {
    const password = this.datos.newPassword;
    this.mensajePassword = '';
    if (!password) {
      this.mensajePassword = 'La contraseña es obligatoria.';
      return;
    }
    if (password.length < 8) { this.mensajePassword = 'La contraseña debe tener al menos 8 caracteres.'; return; }
    if (!/[A-Z]/.test(password)) { this.mensajePassword = 'Debe contener al menos una mayúscula.'; return; }
    if (!/[a-z]/.test(password)) { this.mensajePassword = 'Debe contener al menos una minúscula.'; return; }
    if (!/\d/.test(password)) { this.mensajePassword = 'Debe contener al menos un número.'; return; }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) { this.mensajePassword = 'Debe contener al menos un carácter especial.'; return; }
  }

  validarPassword(): boolean {
    this.onPasswordChange();
    return this.mensajePassword === '';
  }
}