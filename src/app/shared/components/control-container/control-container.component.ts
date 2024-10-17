import {ChangeDetectionStrategy, Component, contentChild, effect, input} from "@angular/core";
import {NgControl} from "@angular/forms";
import {toObservable} from "@angular/core/rxjs-interop";
import {map, switchMap} from "rxjs";
import {AsyncPipe} from "@angular/common";

const errorText: Record<string, string> = {
  required: 'This field is required',
  country: 'Please provide a correct Country',
  birthday: 'Please provide a correct Birthday',
  username: 'Please provide a correct Username',
}

@Component({
  selector: 'control-container',
  standalone: true,
  template: `
    <ng-content/>
    <div class="invalid-feedback control-container__feedback">
      @if (errorText$ | async; as errorText) {
        {{ errorText }}
      }
    </div>
  `,
  host: {
    'class': 'd-flex flex-column'
  },
  styles: `
    .control-container__feedback {
      min-height: 1rem;
    }
  `,
  imports: [
    AsyncPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ControlContainerComponent {
  label = input<string>();

  control = contentChild.required(NgControl);

  errorText$ = toObservable(this.control).pipe(
    switchMap(control => control.statusChanges!.pipe(map(() => control))),
    map((control) => {
      const firstError = Object.keys(control.errors ?? {})[0];
      return firstError ? errorText[firstError] : null;
    }),
  )
}
