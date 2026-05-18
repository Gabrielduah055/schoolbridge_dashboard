import { Component, Input } from '@angular/core';
import { getIconPath } from '../../../core/navigation';

@Component({
  selector: 'app-topbar',
  standalone: true,
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css'
})
export class TopbarComponent {
  @Input() pageTitle = 'Dashboard';
  @Input() pageSubtitle = 'Good morning, Mr. Asante';

  readonly schoolName = 'Accra Academy';
  readonly getIconPath = getIconPath;
}
