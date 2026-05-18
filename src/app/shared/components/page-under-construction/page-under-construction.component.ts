import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-page-under-construction',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './page-under-construction.component.html',
  styleUrl: './page-under-construction.component.css'
})
export class PageUnderConstructionComponent {
  @Input({ required: true }) pageTitle = '';
}
