import { Routes } from '@angular/router';
import { Registro } from './registro/registro';
import { Login } from './login/login';
import { Home } from './home/home';
import { RecuperarPasswordComponent } from './login/recuperar-password.component';

export const routes: Routes = [
  { path: 'login', component: Login },      // Ruta para login
  { path: 'registro', component: Registro }, // Ruta para registro
  { path: 'home', component: Home },        // Ruta para home
  { path: 'recuperar-password', component: RecuperarPasswordComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' } // Redirige a home al inicio
];