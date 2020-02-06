import * as R from 'ramda';
import { Component, OnInit, ViewChild, OnDestroy, TrackByFunction } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { untilComponentDestroyed } from 'ng2-rx-componentdestroyed';
import { combineLatest } from 'rxjs';
import { startWith, debounceTime, map, tap } from 'rxjs/operators';

import { UsersService } from './services';
import { IUser } from './interfaces';

const DEBOUNCE_TIME = 500; // ms

interface IUserTableElement {
  id: string;
  phone: string;
  lastName: string;
  firstName: string;
  city: string;
  birthDate: string;
}
interface IUserFilters {
  lastName: string;
  city: string;
  phone: number;
  fromBirthDate: string;
  toBirthDate: string;
  numberOfRowsPerPage: number;
  currentPage: number;
}

const toUserElement = (item: IUser): IUserTableElement => ({
  id: R.path(['id', 'value'], item),
  phone: R.prop('phone', item),
  firstName: R.path(['name', 'first'], item),
  lastName: R.path(['name', 'last'], item),
  city: R.path(['location', 'city'], item),
  birthDate: R.prop('dob', item),
});

const extractNumbers: (q: string) => string = R.compose(R.join(''), R.match(/\d/g));

const ELEMENT_DATA: IUserTableElement[] = [];

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  public filters: FormGroup;
  @ViewChild(MatTable, { static: true }) private table: MatTable<IUserTableElement>;

  public displayedColumns: string[] = ['firstName', 'lastName', 'phone', 'city', 'birthDate'];
  public dataSource = new MatTableDataSource<IUserTableElement>(ELEMENT_DATA);
  public trackById: TrackByFunction<IUserTableElement> = R.compose(R.prop('id'), R.nthArg(1));
  public pages: number[] = [1];
  public rowsPerPageOptions = [10, 20, 30];

  public get hasAnyUsers() {
    return this.dataSource.data.length > 0;
  }

  public isLoading: boolean;

  public get minFilterDate() {
    const date = this.filters.get('fromBirthDate').value;
    return date ? new Date(date) : null;
  }

  public get maxFilterDate() {
    const date = this.filters.get('toBirthDate').value;
    return date ? new Date(date) : null;
  }

  constructor(
    private readonly users: UsersService,
    ) {}

  ngOnInit() {
    this.filters = this.createFiltersForm();
    this.isLoading = true;
    const user$ = this.users.getAll().pipe(
      map<IUser[], IUserTableElement[]>(R.map(toUserElement)),
      tap(() => this.isLoading = false),
    );
    const filter$ = this.filters.valueChanges.pipe(
      startWith(this.filters.value),
      debounceTime(DEBOUNCE_TIME),
    );
    combineLatest(filter$, user$).pipe(
      untilComponentDestroyed(this),
      tap<[IUserFilters, IUserTableElement[]]>(([filters, users]) => {
        const filteredUsers = this.filterUsersRows(users, filters);
        const pagesLength = R.max(1, Math.ceil(filteredUsers.length / filters.numberOfRowsPerPage));
        if (pagesLength !== this.pages.length) {
          this.pages = R.range(1, pagesLength + 1);
          this.filters.get('currentPage').patchValue(1, { emitEvent: false });
          filters = R.assoc('currentPage', 1, filters);
        }
        const usersOnPage = this.getUsersOnPage(filteredUsers, filters.numberOfRowsPerPage, filters.currentPage);
        this.dataSource.data = usersOnPage;
        if (this.table) {
          this.table.renderRows();
        }
      }),
    ).subscribe();
  }

  ngOnDestroy() {}

  public resetFilters() {
    const { numberOfRowsPerPage, currentPage } = this.filters.value;
    this.filters.reset({
      lastName: '',
      phone: null,
      city: '',
      fromBirthDate: null,
      toBirthDate: null,
      // leave paging filters the same
      numberOfRowsPerPage,
      currentPage,
    });
  }

  private createFiltersForm() {
    return new FormGroup({
      lastName: new FormControl(''),
      phone: new FormControl(),
      city: new FormControl(''),
      fromBirthDate: new FormControl(),
      toBirthDate: new FormControl(),
      numberOfRowsPerPage: new FormControl(10),
      currentPage: new FormControl(1),
    });
  }

  private filterUsersRows(users: IUserTableElement[], filters: IUserFilters): IUserTableElement[] {
    const phone = `${filters.phone || ''}`;
    const filteredUsers = R.filter((user: IUserTableElement) => {
      const lastNameBlock = !R.isEmpty(filters.lastName) && !R.contains(filters.lastName, user.lastName);
      if (lastNameBlock) {
        return false;
      }

      const cityBlock = !R.isEmpty(filters.city) && !R.contains(filters.city, user.city);
      if (cityBlock) {
        return false;
      }

      const phoneBlock = !R.isEmpty(phone) && !R.contains(phone, extractNumbers(user.phone));
      if (phoneBlock) {
        return false;
      }

      const userBirthDate = new Date(user.birthDate);
      const fromDateBlock = !R.isNil(filters.fromBirthDate) && !R.gte(userBirthDate, new Date(filters.fromBirthDate));
      if (fromDateBlock) {
        return false;
      }

      const toDateBlock = !R.isNil(filters.toBirthDate) && !R.lte(userBirthDate, new Date(filters.toBirthDate));
      if (toDateBlock) {
        return false;
      }

      return true;
    }, users);

    return filteredUsers;
  }

  private getUsersOnPage(users: IUserTableElement[], rowsPerPage: number, currentPage: number): IUserTableElement[] {
    const splittedUsersPerPages = R.splitEvery(rowsPerPage, users);
    const usersOnPage = R.nth(currentPage - 1, splittedUsersPerPages) || [];

    return usersOnPage;
  }
}
