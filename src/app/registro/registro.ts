import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';       
import { HttpClientModule } from '@angular/common/http';
import { UsuariosService } from '../servicios/usuarios';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registro',
  standalone: true,                
  imports: [CommonModule, FormsModule, HttpClientModule],  
  templateUrl: './registro.html',
  styleUrls: ['./registro.css']
})
export class Registro {

  usuario = { 
    nombre: '', 
    apellido: '', 
    email: '', 
    password: '', 
    fechaNacimiento: '', 
    genero: '', 
    telefono: '' // El usuario solo ingresa el número
  };
  mensaje = '';
  mensajePassword = '';
  mostrarPassword = false;

  // Variables para los selectores de fecha
  dias: number[] = Array.from({ length: 31 }, (_, i) => i + 1);
  meses: string[] = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  anios: number[] = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i); // Últimos 100 años

  diaSeleccionado: number | null = null;
  mesSeleccionado: string = '';
  anioSeleccionado: number | null = null;

  constructor(private usuarioService: UsuariosService, private router: Router) { }

  registrar() {
    // Limpiar mensaje de error general
    this.mensaje = '';

    // Validar contraseña
    if (!this.validarPassword()) {
      return;
    }

    this.usuarioService.registrarUsuario(this.usuario).subscribe(
      res => {
        this.router.navigate(['/login']);
      },
      err => {
        console.log("Error completo:", err);
        this.mensaje = "Error al registrar: " + (err.error || "Error desconocido");
      }
    );
  }

  validarPassword(): boolean {
    const password = this.usuario.password;

    // Longitud mínima
    if (password.length < 8) {
      this.mensajePassword = 'La contraseña debe tener al menos 8 caracteres';
      return false;
    }

    // Al menos una letra mayúscula
    if (!/[A-Z]/.test(password)) {
      this.mensajePassword = 'La contraseña debe contener al menos una letra mayúscula';
      return false;
    }

    // Al menos una letra minúscula
    if (!/[a-z]/.test(password)) {
      this.mensajePassword = 'La contraseña debe contener al menos una letra minúscula';
      return false;
    }

    // Al menos un número
    if (!/\d/.test(password)) {
      this.mensajePassword = 'La contraseña debe contener al menos un número';
      return false;
    }

    // Al menos un carácter especial
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      this.mensajePassword = 'La contraseña debe contener al menos un carácter especial (!@#$%^&*...)';
      return false;
    }

    this.mensajePassword = '';
    return true;
  }

  onPasswordChange() {
    const password = this.usuario.password;

    if (password.length === 0) {
      this.mensajePassword = '';
      return;
    }

    // Validaciones en tiempo real
    if (password.length < 8) {
      this.mensajePassword = 'La contraseña debe tener al menos 8 caracteres';
      return;
    }

    if (!/[A-Z]/.test(password)) {
      this.mensajePassword = 'La contraseña debe contener al menos una letra mayúscula';
      return;
    }

    if (!/[a-z]/.test(password)) {
      this.mensajePassword = 'La contraseña debe contener al menos una letra minúscula';
      return;
    }

    if (!/\d/.test(password)) {
      this.mensajePassword = 'La contraseña debe contener al menos un número';
      return;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      this.mensajePassword = 'La contraseña debe contener al menos un carácter especial (!@#$%^&*...)';
      return;
    }

    this.mensajePassword = '';
  }

  getPasswordStrength(): { level: string; percentage: number; color: string } {
    const password = this.usuario.password;
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

  irALogin() {
    this.router.navigate(['/login']);
  }

  togglePasswordVisibility() {
    this.mostrarPassword = !this.mostrarPassword;
  }

  actualizarFecha() {
    if (this.diaSeleccionado && this.mesSeleccionado && this.anioSeleccionado) {
      const mesIndex = this.meses.indexOf(this.mesSeleccionado) + 1;
      const mesStr = mesIndex < 10 ? '0' + mesIndex : mesIndex.toString();
      const diaStr = this.diaSeleccionado < 10 ? '0' + this.diaSeleccionado : this.diaSeleccionado.toString();
      this.usuario.fechaNacimiento = `${this.anioSeleccionado}-${mesStr}-${diaStr}`;
    }
  }
}