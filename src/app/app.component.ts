import {Component, DestroyRef, inject} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {
  debounceTime,
  distinctUntilChanged,
  map,
  merge,
  Observable,
  OperatorFunction,
  Subject,
  switchMap,
  take,
  takeUntil,
  tap,
  timer
} from "rxjs";
import {CheckUserResponseData} from "./shared/interface/responses";
import {AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators} from "@angular/forms";
import {Country} from "./shared/enum/country";
import {NgbDateAdapter, NgbDateNativeAdapter} from "@ng-bootstrap/ng-bootstrap";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

interface RequestData {
  country: Country | null;
  username: string | null;
  birthday: Date | null;
}

type FormControlsFrom<T> = {
  [key in keyof T]: FormControl<T[key]>;
}

const countryOptions = Object.values(Country);

function validateCountry(abstractControl: AbstractControl): ValidationErrors | null {
  const value = abstractControl.value;
  if (countryOptions.includes(value)) {
    return null;
  }
  return {
    country: true
  }
}


function validateBirthday(control: AbstractControl): ValidationErrors | null {
  const date = control.value;
  if (!date) {
    return null;
  }
  if (date && date instanceof Date) {
    return date <= new Date() ? null : {birthday: true}
  }
  if (typeof date === 'string') {
    const dateFromString = new Date(date);
    return dateFromString <= new Date() ? null : {birthday: true}
  }
  return null
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [
    {provide: NgbDateAdapter, useClass: NgbDateNativeAdapter}
  ]
})
export class AppComponent {
  readonly fb = inject(FormBuilder);
  readonly httpClient = inject(HttpClient);
  readonly destroyRef = inject(DestroyRef);

  readonly form = this.fb.group({
    array: this.fb.array<FormGroup<FormControlsFrom<RequestData>>>([])
  })

  readonly cancelSeconds = 5;

  readonly startSending = new Subject<void>();
  readonly cancel$ = new Subject<void>();

  readonly cancelSeconds$ = this.startSending.pipe(
    switchMap(() => merge(timer(0, 1000)
        .pipe(
          map(v => this.cancelSeconds - v),
          tap(v => {
            if (v === 0) {
              this.send()
            }
          }),
          take(this.cancelSeconds + 1),
          takeUntil(this.cancel$)
        ),
      this.cancel$.pipe(map(() => 0))
    )),
  )

  get formArray() {
    return this.form.controls.array;
  }

  readonly formTemplateCtx!: {
    $implicit: FormGroup;
    id: string;
  }

  readonly countryOptions = countryOptions;

  ids: string[] = [];

  get invalidFormsCount() {
    return this.formArray.controls.filter(form => (form.invalid || form.pending) && form.dirty).length
  }

  search: OperatorFunction<string, readonly string[]> = (text$: Observable<string>) => {
    const debouncedText$ = text$.pipe(debounceTime(200), distinctUntilChanged());


    return debouncedText$.pipe(
      map((term) => {
          const searchString = term.toLowerCase();
          return (term === '' ? this.countryOptions : this.countryOptions.filter((v) => v.toLowerCase().indexOf(searchString) > -1)).slice(0, 10);
        },
      ),
    );
  };

  addItem(): void {
    if (this.formArray.controls.length >= 10) {
      return;
    }
    this.ids = [...this.ids, this.generateId()];
    this.formArray.push(this.fb.group({
      birthday: this.fb.control<Date | null>(null, {validators: [Validators.required, validateBirthday]}),
      country: this.fb.control<Country | null>(null, {validators: [Validators.required, validateCountry]}),
      username: this.fb.control<string | null>(null, {
        validators: [Validators.required],
        asyncValidators: [control => this.validateUsername(control)],
        updateOn: 'blur'
      })
    }))
  }

  removeItem(index: number) {
    this.formArray.removeAt(index);
    this.ids = this.ids.splice(index, 1).slice();
  }

  generateId(): string {
    return Math.round(Math.random() * 1000).toString();
  }

  validateUsername(control: AbstractControl): Observable<ValidationErrors | null> {
    const username = control.value;
    return this.httpClient.post<CheckUserResponseData>('/api/checkUsername', {
      username
    }).pipe(
      tap(console.log),
      map(({isAvailable}) => isAvailable ? null : {username: true})
    )
  }

  submit() {
    this.form.disable();
    this.startSending.next();
  }

  cancel() {
    this.form.enable({onlySelf: true});
    this.cancel$.next();
  }

  private send() {
    const rawValue = this.form.getRawValue();
    this.httpClient.post('/api/submitForm', rawValue.array).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((result) => {
      console.log(result);
      this.formArray.clear();
      this.form.reset();
      this.form.enable();
    })
  }
}
