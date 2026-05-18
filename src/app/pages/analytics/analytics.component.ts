import { Component } from '@angular/core';
import { PageUnderConstructionComponent } from '../../shared/components/page-under-construction/page-under-construction.component';

@Component({
  selector: 'app-analytics-page',
  standalone: true,
  imports: [PageUnderConstructionComponent],
  template: '<app-page-under-construction pageTitle="Analytics" />'
})
export class AnalyticsComponent {}
