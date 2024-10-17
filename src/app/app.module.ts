import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AppComponent} from './app.component';
import {RouterOutlet} from "@angular/router";
import {HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi} from "@angular/common/http";
import {MockBackendInterceptor} from "./shared/mock-backend/mock-backend.interceptor";
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {TemplateContextDirective} from "./shared/directives/template-context/template-context.directive";
import {ReactiveFormsModule} from "@angular/forms";
import {InputValidationDirective} from "./shared/directives/input/input-validation.directive";
import {ControlContainerComponent} from "./shared/components/control-container/control-container.component";

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    RouterOutlet,
    NgbModule,
    TemplateContextDirective,
    ReactiveFormsModule,
    InputValidationDirective,
    ControlContainerComponent
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: MockBackendInterceptor, multi: true }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
