import { TestBed, inject } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { Environment, environment } from '@app/env';

import { UsersService } from './users.service';

describe('UsersService', () => {
  const mockResponse: any = {
    results: [{
      id: '123',
    }],
  };

  beforeEach(() => TestBed.configureTestingModule({
    imports: [HttpClientTestingModule],
    providers: [
      {
        provide: Environment,
        useValue: environment,
      },
      UsersService,
    ]
  }));

  it('should be created', () => {
    const service: UsersService = TestBed.get(UsersService);
    expect(service).toBeTruthy();
  });

  it('should get users data', inject(
    [HttpTestingController, UsersService],
    (httpMock: HttpTestingController, usersService: UsersService) => {
      usersService.getAll().subscribe((users) => {
        expect(users).toEqual(mockResponse.results);
      });

      const mockReq = httpMock.expectOne(`${environment.api.baseUrl}/users.json`);
      expect(mockReq.cancelled).toBeFalsy();
      expect(mockReq.request.responseType).toEqual('json');

      mockReq.flush(mockResponse);

      httpMock.verify();
    }
  ));
});
