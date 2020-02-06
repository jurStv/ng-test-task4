import { Component, OnInit, Input, HostBinding } from '@angular/core';

@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.scss'],
})
export class SpinnerComponent implements OnInit {
  @HostBinding('style.height') @Input() height = '100%';

  constructor() { }

  ngOnInit() {
  }
}
