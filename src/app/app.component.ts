import { Component } from '@angular/core';
import { SessionExpiryMonitorService } from './auth/session-expiry-monitor.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {

    constructor(private readonly _sessionExpiry: SessionExpiryMonitorService) {}
}
