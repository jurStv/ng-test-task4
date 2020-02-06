import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { pluck, catchError } from 'rxjs/operators';

import { Environment } from '@app/env';
import { IUser } from '@app/interfaces';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  constructor(
    private readonly env: Environment,
    private readonly http: HttpClient,
  ) { }

  getAll(): Observable<IUser[]> {
    return this.http.get(`${this.env.api.baseUrl}/users`).pipe(
      catchError((err) => {
        console.log('Take care of it: ', err);
        return import('./users.json');
      }),
      pluck('results'),
    );
  }
}
