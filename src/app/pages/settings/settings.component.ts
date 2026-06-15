import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  readonly apiUrl = environment.apiUrl;
  adminApiKey = '';
  saved = false;

  ngOnInit(): void {
    this.adminApiKey = localStorage.getItem('schoolbridge_admin_api_key') || environment.adminApiKey || '';
  }

  save(): void {
    localStorage.setItem('schoolbridge_admin_api_key', this.adminApiKey.trim());
    this.saved = true;
    window.setTimeout(() => this.saved = false, 2500);
  }

  clear(): void {
    this.adminApiKey = '';
    localStorage.removeItem('schoolbridge_admin_api_key');
    this.saved = true;
    window.setTimeout(() => this.saved = false, 2500);
  }
}
