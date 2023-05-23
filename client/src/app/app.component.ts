import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'keysearch';

  data: any

  constructor(private httpClient: HttpClient) {}

  ngOnInit() {
    this.httpClient.get('/api/pairs').subscribe({
      next: (result) => {
        this.data = result
        console.log(result,  this.data )
      }
    })
  }
}
