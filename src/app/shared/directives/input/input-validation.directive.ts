import {AfterViewInit, booleanAttribute, computed, Directive, inject, input} from "@angular/core";
import {FormControlStatus, NgControl} from "@angular/forms";
import {toSignal} from "@angular/core/rxjs-interop";
import {Observable, Subject, switchMap} from "rxjs";

@Directive({
  selector: '[appInputValidation]',
  standalone: true,
  host: {
    'class': 'form-control',
    '[class.is-invalid]': 'isInvalid()',
    '[class.is-valid]': 'isValid()',
    '[class.is-pending]': 'isPending()',
  }
})
export class InputValidationDirective implements AfterViewInit {
  readonly ngControl = inject(NgControl);

  showValid = input(false, {
    transform: booleanAttribute
  });
  showPending = input(false, {
    transform: booleanAttribute
  });

  readonly viewInit$ = new Subject<void>();

  status = toSignal(this.viewInit$.pipe(
    switchMap(() => this.ngControl.statusChanges! as Observable<FormControlStatus>),
  ), {initialValue: null})

  isInvalid = computed(() => this.status() === 'INVALID')

  isValid = computed(() => this.status() === 'VALID' && this.showValid())

  isPending = computed(() => this.status() === 'PENDING' && this.showPending())


  ngAfterViewInit(): void {
    this.viewInit$.next();
    this.viewInit$.complete();
  }
}
