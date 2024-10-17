import {Directive, Input, TemplateRef} from "@angular/core";

@Directive({
  selector: 'ng-template[templateContext]',
  standalone: true
})
export class TemplateContextDirective<T> {
  @Input({required: true}) templateContext!: T;

  constructor(readonly templateRef: TemplateRef<T>) {
  }

  static ngTemplateContextGuard<T>(dir: TemplateContextDirective<T>, ctx: unknown): ctx is T {
    return true;
  }
}
